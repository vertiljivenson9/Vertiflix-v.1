import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
// CANAL donde se publicarán los videos (sin @)
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL || 'VertiflixVideos'

// Ruta del archivo de persistencia
const DATA_DIR = path.join(process.cwd(), 'data')
const SESSIONS_FILE = path.join(DATA_DIR, 'telegram-sessions.json')
const MOVIES_FILE = path.join(DATA_DIR, 'telegram-movies.json')

// ====== INTERFACES ======

interface MovieSession {
  chatId: number
  step: 'waiting_video' | 'waiting_image' | 'waiting_title' | 'waiting_year' | 'waiting_category' | 'confirming'
  videoFileId?: string
  videoUrl?: string
  videoMessageId?: number
  channelMessageId?: number  // ID del mensaje en el CANAL
  imageFileId?: string
  imageUrl?: string
  title?: string
  year?: number
  category?: string
  duration?: number
  fileName?: string
  fileSize?: number
  createdAt: string
}

interface TelegramMovie {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl: string
  fileId?: string
  thumbnailFileId?: string
  category: string
  year: number
  duration: number
  rating: number
  language: string
  addedBy: string
  addedAt: string
  fileName?: string
  fileSize?: number
  approved: boolean
  // Para reproducción en Telegram - ESTO ES LO IMPORTANTE
  channelMessageId?: number
  channelUsername?: string
  telegramLink?: string  // Link público: https://t.me/canal/message_id
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

// ====== PERSISTENCIA ======

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function loadSessions(): Record<number, MovieSession> {
  try {
    ensureDataDir()
    if (fs.existsSync(SESSIONS_FILE)) {
      const data = fs.readFileSync(SESSIONS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading sessions:', error)
  }
  return {}
}

function saveSessions(sessions: Record<number, MovieSession>) {
  try {
    ensureDataDir()
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2))
  } catch (error) {
    console.error('Error saving sessions:', error)
  }
}

function loadMovies(): TelegramMovie[] {
  try {
    ensureDataDir()
    if (fs.existsSync(MOVIES_FILE)) {
      const data = fs.readFileSync(MOVIES_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading movies:', error)
  }
  return []
}

function saveMovies(movies: TelegramMovie[]) {
  try {
    ensureDataDir()
    fs.writeFileSync(MOVIES_FILE, JSON.stringify(movies, null, 2))
  } catch (error) {
    console.error('Error saving movies:', error)
  }
}

// ====== FUNCIONES DE TELEGRAM ======

async function sendMessage(chatId: number | string, text: string, options?: Record<string, unknown>) {
  if (!BOT_TOKEN) return
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        ...options
      })
    })
    return await response.json()
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

async function sendPhoto(chatId: number | string, photo: string, caption?: string) {
  if (!BOT_TOKEN) return
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo,
        caption,
        parse_mode: 'Markdown'
      })
    })
    return await response.json()
  } catch (error) {
    console.error('Error sending photo:', error)
  }
}

// Enviar video al CANAL y obtener message_id
async function sendVideoToChannel(fileId: string, caption?: string): Promise<{ messageId: number; success: boolean }> {
  if (!BOT_TOKEN) {
    console.error('No BOT_TOKEN')
    return { messageId: 0, success: false }
  }
  
  try {
    // Enviar video al canal
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendVideo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: `@${CHANNEL_USERNAME}`,
        video: fileId,
        caption: caption || '',
        supports_streaming: true,
        parse_mode: 'Markdown'
      })
    })
    
    const data = await response.json()
    console.log('📤 Video sent to channel:', JSON.stringify(data, null, 2))
    
    if (data.ok && data.result?.message_id) {
      return { messageId: data.result.message_id, success: true }
    }
  } catch (error) {
    console.error('Error sending video to channel:', error)
  }
  
  return { messageId: 0, success: false }
}

// Reenviar mensaje al canal
async function forwardToChannel(chatId: number, messageId: number): Promise<{ messageId: number; success: boolean }> {
  if (!BOT_TOKEN) {
    console.error('No BOT_TOKEN')
    return { messageId: 0, success: false }
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/forwardMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: `@${CHANNEL_USERNAME}`,
        from_chat_id: chatId,
        message_id: messageId
      })
    })
    
    const data = await response.json()
    console.log('📤 Message forwarded to channel:', JSON.stringify(data, null, 2))
    
    if (data.ok && data.result?.message_id) {
      return { messageId: data.result.message_id, success: true }
    }
  } catch (error) {
    console.error('Error forwarding to channel:', error)
  }
  
  return { messageId: 0, success: false }
}

async function getFileUrl(fileId: string): Promise<string> {
  if (!BOT_TOKEN) return ''
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`)
    const data = await response.json()
    
    if (data.ok) {
      return `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`
    }
  } catch (error) {
    console.error('Error getting file:', error)
  }
  return ''
}

// Teclado con categorías
function getCategoryKeyboard() {
  return {
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
}

// Teclado de confirmación
function getConfirmKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '✅ Guardar' }, { text: '✏️ Editar' }],
        [{ text: '❌ Cancelar' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  }
}

// Teclado simple
function getSimpleKeyboard() {
  return {
    reply_markup: {
      keyboard: [
        [{ text: '❌ Cancelar' }]
      ],
      resize_keyboard: true
    }
  }
}

// Remover teclado
function removeKeyboard() {
  return {
    reply_markup: {
      remove_keyboard: true
    }
  }
}

// ====== WEBHOOK PRINCIPAL ======

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📩 Telegram Update:', JSON.stringify(body, null, 2))
    
    const message = body.message || body.channel_post
    if (!message) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const fromUser = message.from?.first_name || 'Usuario'
    const fromLastName = message.from?.last_name || ''
    const fullName = `${fromUser} ${fromLastName}`.trim()
    const text = message.text || ''
    const caption = message.caption || ''

    // Cargar sesiones
    const sessions = loadSessions()
    let session = sessions[chatId]

    // ====== COMANDO /start ======
    if (text === '/start') {
      delete sessions[chatId]
      saveSessions(sessions)
      
      await sendMessage(chatId,
        `🎬 *Vertiflix Bot*\n\n` +
        `¡Hola ${fromUser}! 👋\n\n` +
        `Este bot te permite agregar películas a tu plataforma Vertiflix.\n\n` +
        `*Para comenzar:*\n` +
        `Envía /nueva para agregar una película.\n\n` +
        `Los videos se guardarán en nuestro canal público para poder reproducirlos.`
      , removeKeyboard())
      return NextResponse.json({ ok: true })
    }

    // ====== COMANDO /nueva ======
    if (text === '/nueva' || text === '/new') {
      sessions[chatId] = {
        chatId,
        step: 'waiting_video',
        createdAt: new Date().toISOString()
      }
      saveSessions(sessions)
      
      await sendMessage(chatId,
        `🎬 *Nueva Película*\n\n` +
        `Paso 1 de 5: Envía el *video* de la película.\n\n` +
        `Puedes enviar:\n` +
        `• Un video directamente (hasta 2GB)\n` +
        `• Un archivo de video (MP4, MKV, AVI)\n\n` +
        `_El video se publicará en nuestro canal para poder verlo._`
      , getSimpleKeyboard())
      return NextResponse.json({ ok: true })
    }

    // ====== COMANDO /cancelar ======
    if (text === '❌ Cancelar' || text === '/cancelar' || text === '/cancel') {
      delete sessions[chatId]
      saveSessions(sessions)
      await sendMessage(chatId, '❌ Proceso cancelado.\n\nEnvía /nueva para empezar de nuevo.', removeKeyboard())
      return NextResponse.json({ ok: true })
    }

    // ====== COMANDO /list ======
    if (text === '/list' || text === '/lista') {
      const movies = loadMovies().filter(m => m.approved)
      if (movies.length === 0) {
        await sendMessage(chatId, '📭 No hay películas agregadas.\n\nUsa /nueva para agregar una.')
      } else {
        let list = `🎬 *Películas en Vertiflix (${movies.length}):*\n\n`
        movies.slice(-10).reverse().forEach((m, i) => {
          const cat = CATEGORIES.find(c => c.id === m.category)
          list += `${i + 1}. ${cat?.emoji || '🎬'} *${m.title}*\n   📅 ${m.year} | 🔗 [Ver](${m.telegramLink})\n`
        })
        await sendMessage(chatId, list)
      }
      return NextResponse.json({ ok: true })
    }

    // ====== SIN SESIÓN ACTIVA ======
    if (!session) {
      await sendMessage(chatId,
        `👋 ¡Hola!\n\n` +
        `Envía /nueva para agregar una película.\n` +
        `Envía /list para ver las películas.`
      , removeKeyboard())
      return NextResponse.json({ ok: true })
    }

    // ====== PASO 1: ESPERANDO VIDEO ======
    if (session.step === 'waiting_video') {
      // Video enviado
      if (message.video) {
        const video = message.video
        const fileId = video.file_id
        const duration = video.duration || 0
        const fileSize = video.file_size || 0
        const messageId = message.message_id
        
        // IMPORTANTE: Reenviar el video al CANAL para tener un link público
        const channelResult = await forwardToChannel(chatId, messageId)
        
        session.videoFileId = fileId
        session.videoMessageId = messageId
        session.channelMessageId = channelResult.messageId || 0
        session.duration = Math.floor(duration / 60)
        session.fileName = caption || `Video_${Date.now()}`
        session.fileSize = fileSize
        session.step = 'waiting_image'
        sessions[chatId] = session
        saveSessions(sessions)
        
        const channelInfo = channelResult.success 
          ? `\n✅ Video publicado en el canal` 
          : `\n⚠️ No se pudo publicar en el canal`
        
        await sendMessage(chatId,
          `✅ *Video recibido*\n\n` +
          `📁 Tamaño: ${(fileSize / 1024 / 1024).toFixed(1)} MB\n` +
          `⏱ Duración: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}${channelInfo}\n\n` +
          `Paso 2 de 5: Envía la *imagen/poster* de la película.\n\n` +
          `Escribe "saltar" para usar imagen por defecto.`
        , getSimpleKeyboard())
        return NextResponse.json({ ok: true })
      }
      
      // Documento de video
      if (message.document) {
        const doc = message.document
        const mimeType = doc.mime_type || ''
        const fileName = doc.file_name || 'video'
        
        if (mimeType.startsWith('video/') || fileName.match(/\.(mp4|mkv|avi|mov|webm)$/i)) {
          const fileId = doc.file_id
          const fileSize = doc.file_size || 0
          const messageId = message.message_id
          
          // Reenviar al canal
          const channelResult = await forwardToChannel(chatId, messageId)
          
          session.videoFileId = fileId
          session.videoMessageId = messageId
          session.channelMessageId = channelResult.messageId || 0
          session.fileName = fileName
          session.fileSize = fileSize
          session.duration = 120
          session.step = 'waiting_image'
          sessions[chatId] = session
          saveSessions(sessions)
          
          await sendMessage(chatId,
            `✅ *Video recibido*\n\n` +
            `📄 Archivo: ${fileName}\n` +
            `📁 Tamaño: ${(fileSize / 1024 / 1024).toFixed(1)} MB\n` +
            `${channelResult.success ? '✅ Publicado en canal' : '⚠️ Error en canal'}\n\n` +
            `Paso 2 de 5: Envía la *imagen/poster* de la película.\n\n` +
            `Escribe "saltar" para usar imagen por defecto.`
          , getSimpleKeyboard())
          return NextResponse.json({ ok: true })
        } else {
          await sendMessage(chatId, '❌ El archivo debe ser un video (MP4, MKV, AVI, MOV, WEBM).')
          return NextResponse.json({ ok: true })
        }
      }
      
      await sendMessage(chatId, '❌ Por favor envía un *video*.')
      return NextResponse.json({ ok: true })
    }

    // ====== PASO 2: ESPERANDO IMAGEN ======
    if (session.step === 'waiting_image') {
      if (message.photo) {
        const photo = message.photo[message.photo.length - 1]
        
        session.imageFileId = photo.file_id
        session.imageUrl = await getFileUrl(photo.file_id)
        session.step = 'waiting_title'
        sessions[chatId] = session
        saveSessions(sessions)
        
        await sendMessage(chatId,
          `✅ *Imagen recibida*\n\n` +
          `Paso 3 de 5: Escribe el *título* de la película.`
        , getSimpleKeyboard())
        return NextResponse.json({ ok: true })
      }
      
      if (text.toLowerCase() === 'saltar' || text.toLowerCase() === 'skip') {
        session.imageUrl = 'default'
        session.step = 'waiting_title'
        sessions[chatId] = session
        saveSessions(sessions)
        
        await sendMessage(chatId,
          `⏭ Imagen por defecto.\n\n` +
          `Paso 3 de 5: Escribe el *título* de la película.`
        , getSimpleKeyboard())
        return NextResponse.json({ ok: true })
      }
      
      await sendMessage(chatId, '❌ Envía una *imagen* o escribe "saltar".')
      return NextResponse.json({ ok: true })
    }

    // ====== PASO 3: ESPERANDO TÍTULO ======
    if (session.step === 'waiting_title') {
      if (text && text.length > 0 && !text.startsWith('/')) {
        session.title = text.substring(0, 100)
        session.step = 'waiting_year'
        sessions[chatId] = session
        saveSessions(sessions)
        
        await sendMessage(chatId,
          `✅ *Título:* ${session.title}\n\n` +
          `Paso 4 de 5: Escribe el *año* de la película.`
        , getSimpleKeyboard())
        return NextResponse.json({ ok: true })
      }
      
      await sendMessage(chatId, '❌ Escribe un título válido.')
      return NextResponse.json({ ok: true })
    }

    // ====== PASO 4: ESPERANDO AÑO ======
    if (session.step === 'waiting_year') {
      const yearMatch = text.match(/\d{4}/)
      
      if (yearMatch) {
        const year = parseInt(yearMatch[0])
        if (year >= 1900 && year <= new Date().getFullYear() + 5) {
          session.year = year
          session.step = 'waiting_category'
          sessions[chatId] = session
          saveSessions(sessions)
          
          await sendMessage(chatId,
            `✅ *Año:* ${year}\n\n` +
            `Paso 5 de 5: Selecciona la *categoría*.`
          , getCategoryKeyboard())
          return NextResponse.json({ ok: true })
        }
      }
      
      await sendMessage(chatId, `❌ Ingresa un año válido (ej: 2024).`)
      return NextResponse.json({ ok: true })
    }

    // ====== PASO 5: ESPERANDO CATEGORÍA ======
    if (session.step === 'waiting_category') {
      let selectedCategory: string | null = null
      
      for (const cat of CATEGORIES) {
        if (text.includes(cat.name) || text.includes(cat.emoji) || text.toLowerCase() === cat.id) {
          selectedCategory = cat.id
          break
        }
      }
      
      if (selectedCategory) {
        session.category = selectedCategory
        session.step = 'confirming'
        sessions[chatId] = session
        saveSessions(sessions)
        
        const cat = CATEGORIES.find(c => c.id === selectedCategory)
        
        // Generar el LINK PÚBLICO al video en el canal
        const telegramLink = session.channelMessageId 
          ? `https://t.me/${CHANNEL_USERNAME}/${session.channelMessageId}`
          : null
        
        const summary = 
          `📋 *Resumen de la Película*\n\n` +
          `🎬 *Título:* ${session.title}\n` +
          `📅 *Año:* ${session.year}\n` +
          `📁 *Categoría:* ${cat?.emoji} ${cat?.name}\n` +
          `⏱ *Duración:* ${session.duration} min\n` +
          `📁 *Tamaño:* ${session.fileSize ? (session.fileSize / 1024 / 1024).toFixed(1) + ' MB' : 'N/A'}\n` +
          `${telegramLink ? `🔗 *Link:* [Ver en Telegram](${telegramLink})\n` : ''}\n` +
          `¿Deseas guardar esta película?`
        
        if (session.imageUrl && session.imageUrl !== 'default') {
          await sendPhoto(chatId, session.imageFileId!, summary)
          await sendMessage(chatId, 'Selecciona una opción:', getConfirmKeyboard())
        } else {
          await sendMessage(chatId, summary, getConfirmKeyboard())
        }
        return NextResponse.json({ ok: true })
      }
      
      await sendMessage(chatId, '❌ Selecciona una categoría del teclado.')
      return NextResponse.json({ ok: true })
    }

    // ====== CONFIRMACIÓN ======
    if (session.step === 'confirming') {
      if (text === '✅ Guardar') {
        const cat = CATEGORIES.find(c => c.id === session.category)
        
        let thumbnailUrl = session.imageUrl
        if (!thumbnailUrl || thumbnailUrl === 'default') {
          const defaultThumbnails: Record<string, string> = {
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
          thumbnailUrl = defaultThumbnails[session.category!] || defaultThumbnails['otros']
        }
        
        // EL LINK PÚBLICO - ESTO ES LO IMPORTANTE
        const telegramLink = session.channelMessageId 
          ? `https://t.me/${CHANNEL_USERNAME}/${session.channelMessageId}`
          : `https://t.me/${CHANNEL_USERNAME}`
        
        const movie: TelegramMovie = {
          id: `tg_${Date.now()}_${session.channelMessageId || session.videoFileId?.substring(0, 8) || 'movie'}`,
          title: session.title!,
          description: `Agregado desde Telegram por ${fullName}`,
          thumbnail: thumbnailUrl!,
          videoUrl: telegramLink, // El link para reproducir
          fileId: session.videoFileId,
          thumbnailFileId: session.imageFileId,
          category: session.category!,
          year: session.year!,
          duration: session.duration || 120,
          rating: 7.0,
          language: 'Español',
          addedBy: fullName,
          addedAt: new Date().toISOString(),
          fileName: session.fileName,
          fileSize: session.fileSize,
          approved: true,
          // Datos para reproducción
          channelMessageId: session.channelMessageId,
          channelUsername: CHANNEL_USERNAME,
          telegramLink: telegramLink
        }
        
        const movies = loadMovies()
        movies.push(movie)
        saveMovies(movies)
        
        delete sessions[chatId]
        saveSessions(sessions)
        
        await sendMessage(chatId,
          `✅ *¡Película guardada!*\n\n` +
          `🎬 *${movie.title}*\n` +
          `${cat?.emoji} ${cat?.name} | ${movie.year}\n\n` +
          `🔗 *Link:* [Ver en Telegram](${telegramLink})\n\n` +
          `La película ya está disponible en Vertiflix.\n` +
          `Envía /nueva para agregar otra.`
        , removeKeyboard())
        return NextResponse.json({ ok: true })
      }
      
      if (text === '✏️ Editar') {
        session.step = 'waiting_title'
        sessions[chatId] = session
        saveSessions(sessions)
        
        await sendMessage(chatId,
          `✏️ *Modo edición*\n\n` +
          `Escribe el nuevo título:`
        , getSimpleKeyboard())
        return NextResponse.json({ ok: true })
      }
      
      await sendMessage(chatId, 'Selecciona una opción del teclado.', getConfirmKeyboard())
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('Error en webhook:', error)
    return NextResponse.json({ ok: true })
  }
}

// ====== GET - Obtener películas ======
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')
  
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  const movies = loadMovies()
  
  return NextResponse.json({ 
    movies,
    total: movies.length,
    categories: CATEGORIES,
    channel: CHANNEL_USERNAME
  })
}

// ====== DELETE - Eliminar película ======
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')
  const movieId = searchParams.get('id')
  
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  if (!movieId) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  }
  
  const movies = loadMovies()
  const filteredMovies = movies.filter(m => m.id !== movieId)
  saveMovies(filteredMovies)
  
  return NextResponse.json({ 
    success: true, 
    deleted: movies.length - filteredMovies.length 
  })
}
