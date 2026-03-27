import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

export const runtime = 'nodejs'
export const maxDuration = 60

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL || 'VertiflixVideos'

// Inicializar Firebase Admin UNA sola vez
let db: ReturnType<typeof getFirestore> | null = null

function getDb() {
  if (!db) {
    if (getApps().length === 0) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      })
    }
    db = getFirestore()
  }
  return db
}

// Categorías disponibles
const CATEGORIES = [
  { id: 'accion', name: 'Acción', emoji: '💥' },
  { id: 'drama', name: 'Drama', emoji: '🎭' },
  { id: 'comedia', name: 'Comedia', emoji: '😂' },
  { id: 'terror', name: 'Terror', emoji: '👻' },
  { id: 'ciencia-ficcion', name: 'Ciencia Ficción', emoji: '🚀' },
  { id: 'anime', name: 'Anime', emoji: '🎌' },
  { id: 'serie', name: 'Serie', emoji: '📺' },
  { id: 'romance', name: 'Romance', emoji: '❤️' },
  { id: 'documental', name: 'Documental', emoji: '🎬' },
  { id: 'otros', name: 'Otros', emoji: '📁' },
]

// Thumbnails por defecto por categoría
const DEFAULT_THUMBS: Record<string, string> = {
  'accion': 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
  'drama': 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
  'comedia': 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
  'terror': 'https://image.tmdb.org/t/p/w500/qVKirUdmoex8SdfUk8WDM3AkfGP.jpg',
  'ciencia-ficcion': 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
  'anime': 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
  'serie': 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
  'romance': 'https://image.tmdb.org/t/p/w500/hUu9zyZmDd8VZegKi1iK1Vk0RYS.jpg',
  'documental': 'https://image.tmdb.org/t/p/w500/kn1PTrWQaUvEei7hZz5jvE6WAIX.jpg',
  'otros': 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg'
}

// ==========================================
// FUNCIONES DE TELEGRAM API
// ==========================================

async function telegramApi(method: string, params: Record<string, unknown>) {
  if (!BOT_TOKEN) return null
  
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    return await res.json()
  } catch (error) {
    console.error(`❌ Telegram ${method} error:`, error)
    return null
  }
}

async function sendMessage(chatId: number, text: string, keyboard?: object) {
  return telegramApi('sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
    ...keyboard
  })
}

async function forwardToChannel(chatId: number, messageId: number): Promise<number> {
  const result = await telegramApi('forwardMessage', {
    chat_id: `@${CHANNEL_USERNAME}`,
    from_chat_id: chatId,
    message_id: messageId
  })
  return result?.result?.message_id || 0
}

// ==========================================
// ENVIAR VIDEO AL CANAL CON STREAMING HABILITADO
// ==========================================

interface SendVideoResult {
  messageId: number
  newFileId: string  // Telegram genera un nuevo file_id cuando envía al canal
}

/**
 * Envía video al canal con supports_streaming: true
 * Esto permite reproducción fluida en Telegram y en nuestro reproductor
 */
async function sendVideoToChannel(
  fileId: string,
  title?: string,
  thumbnailFileId?: string
): Promise<SendVideoResult | null> {
  try {
    const params: Record<string, unknown> = {
      chat_id: `@${CHANNEL_USERNAME}`,
      video: fileId,
      supports_streaming: true,  // 🔑 CLAVE: Habilita streaming
      caption: title ? `🎬 ${title}` : undefined,
      parse_mode: 'Markdown'
    }

    // Si hay thumbnail, agregarlo
    if (thumbnailFileId) {
      params.thumbnail = thumbnailFileId
    }

    console.log(`📤 Enviando video al canal con streaming habilitado...`)

    const result = await telegramApi('sendVideo', params)

    if (result?.ok && result?.result) {
      const messageId = result.result.message_id
      const newFileId = result.result.video?.file_id || fileId

      console.log(`✅ Video enviado al canal:`)
      console.log(`   - Message ID: ${messageId}`)
      console.log(`   - Nuevo file_id: ${newFileId.substring(0, 30)}...`)
      console.log(`   - Streaming: ${result.result.video?.supports_streaming ? '✅' : '❌'}`)

      return { messageId, newFileId }
    }

    console.error('❌ Error enviando video:', result)
    return null

  } catch (error) {
    console.error('❌ Error en sendVideoToChannel:', error)
    return null
  }
}

// Obtener URL de un archivo de Telegram
async function getFileUrl(fileId: string): Promise<string | null> {
  try {
    const result = await telegramApi('getFile', { file_id: fileId })
    if (result?.ok && result?.result?.file_path) {
      return `https://api.telegram.org/file/bot${BOT_TOKEN}/${result.result.file_path}`
    }
    return null
  } catch (error) {
    console.error('❌ Error obteniendo archivo:', error)
    return null
  }
}

// ==========================================
// SESIONES EN FIREBASE
// ==========================================

interface SessionData {
  chat_id: number
  step: string
  video_file_id?: string
  channel_message_id?: number
  file_name?: string
  file_size?: number
  duration?: number
  image_file_id?: string
  image_url?: string
  title?: string
  year?: number
  category?: string
}

async function getSession(chatId: number): Promise<SessionData | null> {
  try {
    const database = getDb()
    const snapshot = await database
      .collection('bot_sessions')
      .where('chat_id', '==', chatId)
      .limit(1)
      .get()
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      return { id: doc.id, ...doc.data() } as SessionData
    }
    return null
  } catch (error) {
    console.error('❌ Error obteniendo sesión:', error)
    return null
  }
}

async function saveSessionData(chatId: number, data: Partial<SessionData>): Promise<void> {
  try {
    const database = getDb()
    const existing = await getSession(chatId)
    
    const updateData = {
      ...data,
      chat_id: chatId,
      updated_at: new Date()
    }
    
    if (existing && (existing as any).id) {
      await database.collection('bot_sessions').doc((existing as any).id).update(updateData)
    } else {
      await database.collection('bot_sessions').add({
        ...updateData,
        created_at: new Date()
      })
    }
  } catch (error) {
    console.error('❌ Error guardando sesión:', error)
  }
}

async function deleteSession(chatId: number): Promise<void> {
  try {
    const database = getDb()
    const existing = await getSession(chatId)
    if (existing && (existing as any).id) {
      await database.collection('bot_sessions').doc((existing as any).id).delete()
    }
  } catch (error) {
    console.error('❌ Error eliminando sesión:', error)
  }
}

// ==========================================
// GUARDAR PELÍCULA EN FIREBASE
// ==========================================

async function saveMovieToFirebase(session: SessionData, userName: string): Promise<string | null> {
  try {
    const database = getDb()
    const link = session.channel_message_id
      ? `https://t.me/${CHANNEL_USERNAME}/${session.channel_message_id}`
      : `https://t.me/${CHANNEL_USERNAME}`

    // Usar la imagen del usuario o la por defecto
    const thumbnail = session.image_url || DEFAULT_THUMBS[session.category || 'otros'] || DEFAULT_THUMBS['otros']

    const movieData = {
      title: session.title || 'Sin título',
      description: `Agregado por ${userName} desde Telegram`,
      thumbnail: thumbnail,
      // NO guardar video_url con link de Telegram - usar MTProto
      file_id: session.video_file_id,           // File ID del canal (con streaming habilitado)
      image_file_id: session.image_file_id,     // File ID del poster
      category: session.category || 'otros',
      year: session.year || new Date().getFullYear(),
      duration: session.duration || 120,
      rating: 7.0,
      language: 'Español',
      telegram_link: link,
      // ✅ CAMPOS PARA MTPROTO STREAMING
      channel_username: CHANNEL_USERNAME,        // Nombre del canal (sin @)
      channel_message_id: session.channel_message_id,  // ID del mensaje en el canal
      added_by: userName,
      approved: false,
      streaming_ready: true,  // Flag para indicar que tiene streaming habilitado
      created_at: new Date(),
      updated_at: new Date()
    }

    const docRef = await database.collection('telegram_movies').add(movieData)
    console.log(`✅ Película guardada con ID: ${docRef.id}`)
    console.log(`   - file_id: ${session.video_file_id?.substring(0, 30)}...`)
    console.log(`   - channel_username: ${CHANNEL_USERNAME}`)
    console.log(`   - channel_message_id: ${session.channel_message_id}`)
    console.log(`   - streaming_ready: true`)
    return docRef.id
  } catch (error) {
    console.error('❌ Error guardando película:', error)
    return null
  }
}

// ==========================================
// DETECTAR VIDEO EN MENSAJE
// ==========================================

function detectVideo(msg: any): { fileId: string; fileName: string; fileSize: number; duration: number } | null {
  if (msg.video) {
    return {
      fileId: msg.video.file_id,
      fileName: msg.caption || `Video_${Date.now()}.mp4`,
      fileSize: msg.video.file_size || 0,
      duration: Math.ceil((msg.video.duration || 7200) / 60)
    }
  }
  
  if (msg.document) {
    const doc = msg.document
    const mimeType = doc.mime_type || ''
    const fileName = doc.file_name || ''
    
    if (mimeType.startsWith('video/') || /\.(mp4|mkv|avi|mov|webm|wmv|flv)$/i.test(fileName)) {
      return {
        fileId: doc.file_id,
        fileName: fileName,
        fileSize: doc.file_size || 0,
        duration: 120
      }
    }
  }
  
  if (msg.video_note) {
    return {
      fileId: msg.video_note.file_id,
      fileName: `VideoNote_${Date.now()}.mp4`,
      fileSize: msg.video_note.file_size || 0,
      duration: Math.ceil((msg.video_note.duration || 120) / 60)
    }
  }
  
  return null
}

// ==========================================
// TECLADOS
// ==========================================

const KEYBOARD_CANCEL = {
  reply_markup: { keyboard: [[{ text: '❌ Cancelar' }]], resize_keyboard: true }
}

const KEYBOARD_CATEGORIES = {
  reply_markup: {
    keyboard: [
      [{ text: '💥 Acción' }, { text: '🎭 Drama' }],
      [{ text: '😂 Comedia' }, { text: '👻 Terror' }],
      [{ text: '🚀 Ciencia Ficción' }, { text: '🎌 Anime' }],
      [{ text: '📺 Serie' }, { text: '❤️ Romance' }],
      [{ text: '🎬 Documental' }, { text: '📁 Otros' }],
      [{ text: '❌ Cancelar' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  }
}

const KEYBOARD_CONFIRM = {
  reply_markup: {
    keyboard: [
      [{ text: '✅ Guardar' }, { text: '✏️ Editar' }],
      [{ text: '❌ Cancelar' }]
    ],
    resize_keyboard: true,
    one_time_keyboard: true
  }
}

const KEYBOARD_NONE = { reply_markup: { remove_keyboard: true } }

// ==========================================
// WEBHOOK PRINCIPAL
// ==========================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = body.message || body.channel_post
    
    if (!message) return NextResponse.json({ ok: true })
    
    const chatId = message.chat?.id
    const text = (message.text || '').trim()
    const userName = message.from?.first_name || 'Usuario'
    const messageId = message.message_id
    
    const video = detectVideo(message)
    const hasPhoto = message.photo && message.photo.length > 0
    const hasVideo = !!video
    
    console.log(`👤 ${userName} (${chatId}) | 📝 "${text}" | 🎬 ${hasVideo} | 🖼 ${hasPhoto}`)
    
    // Comandos básicos
    if (text === '/start') {
      await deleteSession(chatId)
      await sendMessage(chatId,
        `🎬 *Vertiflix Bot*\n\n` +
        `¡Hola ${userName}! 👋\n\n` +
        `*Para agregar una película:*\n` +
        `1️⃣ Envía el video\n` +
        `2️⃣ Envía el poster (o "saltar")\n` +
        `3️⃣ Escribe el título\n` +
        `4️⃣ Escribe el año\n` +
        `5️⃣ Selecciona la categoría\n\n` +
        `Envía /nueva para comenzar`,
        KEYBOARD_NONE
      )
      return NextResponse.json({ ok: true })
    }
    
    if (text === '/nueva' || text === '/new') {
      await deleteSession(chatId)
      await saveSessionData(chatId, { step: 'waiting_video' })
      await sendMessage(chatId,
        `🎬 *Paso 1 de 5*\n\nEnvía el *video* de la película.`,
        KEYBOARD_CANCEL
      )
      return NextResponse.json({ ok: true })
    }
    
    if (text === '❌ Cancelar' || text === '/cancelar' || text === '/cancel') {
      await deleteSession(chatId)
      await sendMessage(chatId, '❌ Cancelado. Envía /nueva para empezar.', KEYBOARD_NONE)
      return NextResponse.json({ ok: true })
    }
    
    // Obtener sesión
    let session = await getSession(chatId)
    
    if (!session && hasVideo) {
      await saveSessionData(chatId, { step: 'waiting_video' })
      session = await getSession(chatId)
    }
    
    if (!session) {
      if (text && !text.startsWith('/')) {
        await sendMessage(chatId, 'Envía /nueva para agregar una película.')
      }
      return NextResponse.json({ ok: true })
    }
    
    const step = session.step
    
    // PASO 1: VIDEO
    if (step === 'waiting_video') {
      if (!hasVideo) {
        await sendMessage(chatId, '❌ No es un video. Envía un video.', KEYBOARD_CANCEL)
        return NextResponse.json({ ok: true })
      }

      const sizeMB = (video.fileSize / 1024 / 1024).toFixed(1)

      // Enviar video al canal con streaming habilitado
      const sendResult = await sendVideoToChannel(video.fileId, video.fileName)

      let channelMessageId = 0
      let channelFileId = video.fileId  // Por defecto usar el original

      if (sendResult) {
        channelMessageId = sendResult.messageId
        channelFileId = sendResult.newFileId  // Usar el nuevo file_id del canal
        console.log(`✅ Video publicado en @${CHANNEL_USERNAME} con streaming habilitado`)
      } else {
        // Fallback: intentar forward normal si sendVideo falla
        console.log('⚠️ sendVideo falló, intentando forward normal...')
        channelMessageId = await forwardToChannel(chatId, messageId)
      }

      await saveSessionData(chatId, {
        step: 'waiting_image',
        video_file_id: channelFileId,  // Guardar el file_id del canal (importante para streaming)
        channel_message_id: channelMessageId,
        file_name: video.fileName,
        file_size: video.fileSize,
        duration: video.duration
      })

      await sendMessage(chatId,
        `✅ *Video recibido*\n\n` +
        `📁 ${video.fileName}\n` +
        `📦 ${sizeMB} MB\n` +
        `⏱ ${video.duration} min\n` +
        `${channelMessageId ? `✅ Publicado en @${CHANNEL_USERNAME}` : '⚠️ No publicado'}\n` +
        `🎬 Streaming: Habilitado\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🎬 *Paso 2 de 5*\n\n` +
        `Envía el *poster* o escribe "saltar".`,
        KEYBOARD_CANCEL
      )
      return NextResponse.json({ ok: true })
    }
    
    // PASO 2: IMAGEN
    if (step === 'waiting_image') {
      if (hasPhoto) {
        const photo = message.photo[message.photo.length - 1]
        
        // Obtener URL de la imagen
        const imageUrl = await getFileUrl(photo.file_id)
        console.log(`🖼 URL de imagen: ${imageUrl}`)
        
        await saveSessionData(chatId, {
          step: 'waiting_title',
          image_file_id: photo.file_id,
          image_url: imageUrl
        })
        
        await sendMessage(chatId,
          `✅ *Imagen recibida*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🎬 *Paso 3 de 5*\n\n` +
          `Escribe el *título* de la película.`,
          KEYBOARD_CANCEL
        )
        return NextResponse.json({ ok: true })
      }
      
      if (text.toLowerCase() === 'saltar' || text.toLowerCase() === 'skip') {
        await saveSessionData(chatId, {
          step: 'waiting_title',
          image_file_id: null,
          image_url: null
        })
        
        await sendMessage(chatId,
          `⏭ *Imagen por defecto*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🎬 *Paso 3 de 5*\n\n` +
          `Escribe el *título* de la película.`,
          KEYBOARD_CANCEL
        )
        return NextResponse.json({ ok: true })
      }
      
      await sendMessage(chatId, '❌ Envía una imagen o escribe "saltar".', KEYBOARD_CANCEL)
      return NextResponse.json({ ok: true })
    }
    
    // PASO 3: TÍTULO
    if (step === 'waiting_title') {
      if (!text || text.startsWith('/')) {
        await sendMessage(chatId, '❌ Escribe un título válido.')
        return NextResponse.json({ ok: true })
      }
      
      await saveSessionData(chatId, { step: 'waiting_year', title: text.substring(0, 100) })
      
      await sendMessage(chatId,
        `✅ *Título:* ${text}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🎬 *Paso 4 de 5*\n\n` +
        `Escribe el *año* (ej: 2024).`,
        KEYBOARD_CANCEL
      )
      return NextResponse.json({ ok: true })
    }
    
    // PASO 4: AÑO
    if (step === 'waiting_year') {
      const yearMatch = text.match(/\d{4}/)
      
      if (!yearMatch) {
        await sendMessage(chatId, '❌ Escribe un año válido (ej: 2024)')
        return NextResponse.json({ ok: true })
      }
      
      const year = parseInt(yearMatch[0])
      
      await saveSessionData(chatId, { step: 'waiting_category', year })
      
      await sendMessage(chatId,
        `✅ *Año:* ${year}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `🎬 *Paso 5 de 5*\n\n` +
        `Selecciona la *categoría*:`,
        KEYBOARD_CATEGORIES
      )
      return NextResponse.json({ ok: true })
    }
    
    // PASO 5: CATEGORÍA
    if (step === 'waiting_category') {
      let categoryId: string | null = null
      
      for (const cat of CATEGORIES) {
        if (text.includes(cat.name) || text.includes(cat.emoji) || text.toLowerCase() === cat.id) {
          categoryId = cat.id
          break
        }
      }
      
      if (!categoryId) {
        await sendMessage(chatId, '❌ Selecciona una categoría del teclado.', KEYBOARD_CATEGORIES)
        return NextResponse.json({ ok: true })
      }
      
      const category = CATEGORIES.find(c => c.id === categoryId)!
      
      await saveSessionData(chatId, { step: 'confirming', category: categoryId })
      
      const link = session.channel_message_id
        ? `https://t.me/${CHANNEL_USERNAME}/${session.channel_message_id}`
        : `https://t.me/${CHANNEL_USERNAME}`
      
      await sendMessage(chatId,
        `📋 *Resumen*\n\n` +
        `🎬 *Título:* ${session.title || 'Sin título'}\n` +
        `📅 *Año:* ${session.year || new Date().getFullYear()}\n` +
        `📁 *Categoría:* ${category.emoji} ${category.name}\n` +
        `⏱ *Duración:* ${session.duration || 120} min\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `¿Guardar esta película?`,
        KEYBOARD_CONFIRM
      )
      return NextResponse.json({ ok: true })
    }
    
    // CONFIRMACIÓN
    if (step === 'confirming') {
      if (text === '✅ Guardar') {
        const category = CATEGORIES.find(c => c.id === session.category)
        const link = session.channel_message_id
          ? `https://t.me/${CHANNEL_USERNAME}/${session.channel_message_id}`
          : `https://t.me/${CHANNEL_USERNAME}`
        
        const movieId = await saveMovieToFirebase(session, userName)
        await deleteSession(chatId)
        
        if (movieId) {
          await sendMessage(chatId,
            `✅ *¡Película Enviada!*\n\n` +
            `🎬 *${session.title}*\n` +
            `${category?.emoji} ${category?.name} | ${session.year}\n\n` +
            `🔗 [Ver en Telegram](${link})\n\n` +
            `⏳ *Pendiente de aprobación*\n\n` +
            `Un administrador revisará tu película pronto.\n\n` +
            `Envía /nueva para agregar otra.`,
            KEYBOARD_NONE
          )
        } else {
          await sendMessage(chatId, '❌ Error al guardar. Intenta con /nueva', KEYBOARD_NONE)
        }
        return NextResponse.json({ ok: true })
      }
      
      if (text === '✏️ Editar') {
        await saveSessionData(chatId, { step: 'waiting_title' })
        await sendMessage(chatId, '✏️ Escribe el nuevo título:', KEYBOARD_CANCEL)
        return NextResponse.json({ ok: true })
      }
      
      if (text === '❌ Cancelar') {
        await deleteSession(chatId)
        await sendMessage(chatId, '❌ Cancelado. Envía /nueva para empezar.', KEYBOARD_NONE)
        return NextResponse.json({ ok: true })
      }
      
      await sendMessage(chatId, 'Selecciona una opción del teclado.', KEYBOARD_CONFIRM)
      return NextResponse.json({ ok: true })
    }
    
    await sendMessage(chatId, 'Envía /nueva para agregar una película.')
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('❌ ERROR:', error)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: 'active',
    bot: 'VertiflixBot',
    channel: CHANNEL_USERNAME,
    timestamp: new Date().toISOString()
  })
}
