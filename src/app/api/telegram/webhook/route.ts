import { NextRequest, NextResponse } from 'next/server'
import { 
  getServerSupabase, 
  upsertBotSession, 
  getBotSession, 
  deleteBotSession,
  addTelegramMovie 
} from '@/lib/supabase'

export const runtime = 'nodejs'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL || 'VertiflixVideos'

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

// ====== FUNCIONES DE TELEGRAM ======

async function sendMessage(chatId: number | string, text: string, options?: Record<string, unknown>) {
  if (!BOT_TOKEN) return
  
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        ...options
      })
    })
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

async function sendPhoto(chatId: number | string, photo: string, caption?: string) {
  if (!BOT_TOKEN) return
  
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo,
        caption,
        parse_mode: 'Markdown'
      })
    })
  } catch (error) {
    console.error('Error sending photo:', error)
  }
}

// Reenviar mensaje al canal
async function forwardToChannel(chatId: number, messageId: number): Promise<{ messageId: number; success: boolean }> {
  if (!BOT_TOKEN) return { messageId: 0, success: false }
  
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

// Teclados
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

function getSimpleKeyboard() {
  return {
    reply_markup: {
      keyboard: [[{ text: '❌ Cancelar' }]],
      resize_keyboard: true
    }
  }
}

function removeKeyboard() {
  return { reply_markup: { remove_keyboard: true } }
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

    // ====== COMANDO /start ======
    if (text === '/start') {
      await deleteBotSession(chatId)
      
      await sendMessage(chatId,
        `🎬 *Vertiflix Bot*\n\n` +
        `¡Hola ${fromUser}! 👋\n\n` +
        `Este bot te permite agregar películas a tu plataforma Vertiflix.\n\n` +
        `*Para comenzar:*\n` +
        `Envía /nueva para agregar una película.\n\n` +
        `Los videos se guardarán en @${CHANNEL_USERNAME}`
      , removeKeyboard())
      return NextResponse.json({ ok: true })
    }

    // ====== COMANDO /nueva ======
    if (text === '/nueva' || text === '/new') {
      await upsertBotSession(chatId, { step: 'waiting_video' })
      
      await sendMessage(chatId,
        `🎬 *Nueva Película*\n\n` +
        `Paso 1 de 5: Envía el *video* de la película.\n\n` +
        `Puedes enviar:\n` +
        `• Un video directamente (hasta 2GB)\n` +
        `• Un archivo de video (MP4, MKV, AVI)`
      , getSimpleKeyboard())
      return NextResponse.json({ ok: true })
    }

    // ====== COMANDO /cancelar ======
    if (text === '❌ Cancelar' || text === '/cancelar' || text === '/cancel') {
      await deleteBotSession(chatId)
      await sendMessage(chatId, '❌ Proceso cancelado.\n\nEnvía /nueva para empezar de nuevo.', removeKeyboard())
      return NextResponse.json({ ok: true })
    }

    // ====== COMANDO /list ======
    if (text === '/list' || text === '/lista') {
      const supabase = getServerSupabase()
      const { data: movies } = await supabase
        .from('telegram_movies')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (!movies || movies.length === 0) {
        await sendMessage(chatId, '📭 No hay películas agregadas.\n\nUsa /nueva para agregar una.')
      } else {
        let list = `🎬 *Películas en Vertiflix (${movies.length}):*\n\n`
        movies.forEach((m, i) => {
          const cat = CATEGORIES.find(c => c.id === m.category)
          list += `${i + 1}. ${cat?.emoji || '🎬'} *${m.title}*\n   📅 ${m.year} | 🔗 [Ver](https://t.me/${CHANNEL_USERNAME}/${m.channel_message_id})\n`
        })
        await sendMessage(chatId, list)
      }
      return NextResponse.json({ ok: true })
    }

    // ====== OBTENER SESIÓN ======
    const session = await getBotSession(chatId)

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
      if (message.video) {
        const video = message.video
        const fileId = video.file_id
        const duration = video.duration || 0
        const fileSize = video.file_size || 0
        const messageId = message.message_id
        
        // Reenviar al canal
        const channelResult = await forwardToChannel(chatId, messageId)
        
        await upsertBotSession(chatId, {
          step: 'waiting_image',
          video_file_id: fileId,
          video_message_id: messageId,
          channel_message_id: channelResult.messageId || 0,
          file_name: caption || `Video_${Date.now()}`,
          file_size: fileSize,
          duration: Math.floor(duration / 60)
        })
        
        const channelInfo = channelResult.success 
          ? `\n✅ Video publicado en @${CHANNEL_USERNAME}` 
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
      
      if (message.document) {
        const doc = message.document
        const mimeType = doc.mime_type || ''
        const fileName = doc.file_name || 'video'
        
        if (mimeType.startsWith('video/') || fileName.match(/\.(mp4|mkv|avi|mov|webm)$/i)) {
          const fileId = doc.file_id
          const fileSize = doc.file_size || 0
          const messageId = message.message_id
          
          const channelResult = await forwardToChannel(chatId, messageId)
          
          await upsertBotSession(chatId, {
            step: 'waiting_image',
            video_file_id: fileId,
            video_message_id: messageId,
            channel_message_id: channelResult.messageId || 0,
            file_name: fileName,
            file_size: fileSize,
            duration: 120
          })
          
          await sendMessage(chatId,
            `✅ *Video recibido*\n\n` +
            `📄 Archivo: ${fileName}\n` +
            `📁 Tamaño: ${(fileSize / 1024 / 1024).toFixed(1)} MB\n` +
            `${channelResult.success ? '✅' : '⚠️'} Canal: @${CHANNEL_USERNAME}\n\n` +
            `Paso 2 de 5: Envía la *imagen/poster*.\n\n` +
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
        
        await upsertBotSession(chatId, {
          step: 'waiting_title',
          image_file_id: photo.file_id,
          image_url: await getFileUrl(photo.file_id)
        })
        
        await sendMessage(chatId,
          `✅ *Imagen recibida*\n\n` +
          `Paso 3 de 5: Escribe el *título* de la película.`
        , getSimpleKeyboard())
        return NextResponse.json({ ok: true })
      }
      
      if (text.toLowerCase() === 'saltar' || text.toLowerCase() === 'skip') {
        await upsertBotSession(chatId, {
          step: 'waiting_title',
          image_url: 'default'
        })
        
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
        await upsertBotSession(chatId, {
          step: 'waiting_year',
          title: text.substring(0, 100)
        })
        
        await sendMessage(chatId,
          `✅ *Título:* ${text.substring(0, 100)}\n\n` +
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
          await upsertBotSession(chatId, {
            step: 'waiting_category',
            year
          })
          
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
        await upsertBotSession(chatId, {
          step: 'confirming',
          category: selectedCategory
        })
        
        const cat = CATEGORIES.find(c => c.id === selectedCategory)
        const telegramLink = session.channel_message_id 
          ? `https://t.me/${CHANNEL_USERNAME}/${session.channel_message_id}`
          : null
        
        // Obtener thumbnail
        let thumbnailUrl = session.image_url
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
          thumbnailUrl = defaultThumbnails[selectedCategory] || defaultThumbnails['otros']
        }
        
        const summary = 
          `📋 *Resumen de la Película*\n\n` +
          `🎬 *Título:* ${session.title}\n` +
          `📅 *Año:* ${session.year}\n` +
          `📁 *Categoría:* ${cat?.emoji} ${cat?.name}\n` +
          `⏱ *Duración:* ${session.duration} min\n` +
          `📁 *Tamaño:* ${session.file_size ? (session.file_size / 1024 / 1024).toFixed(1) + ' MB' : 'N/A'}\n` +
          `${telegramLink ? `🔗 *Link:* [Ver en Telegram](${telegramLink})\n` : ''}\n` +
          `¿Deseas guardar esta película?`
        
        if (session.image_file_id) {
          await sendPhoto(chatId, session.image_file_id, summary)
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
        
        // Thumbnail
        let thumbnailUrl = session.image_url
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
        
        // Link de Telegram
        const telegramLink = session.channel_message_id 
          ? `https://t.me/${CHANNEL_USERNAME}/${session.channel_message_id}`
          : `https://t.me/${CHANNEL_USERNAME}`
        
        // Guardar en Supabase
        const savedMovie = await addTelegramMovie({
          title: session.title!,
          description: `Agregado desde Telegram por ${fullName}`,
          thumbnail: thumbnailUrl!,
          video_url: telegramLink,
          file_id: session.video_file_id,
          thumbnail_file_id: session.image_file_id,
          category: session.category!,
          year: session.year!,
          duration: session.duration || 120,
          rating: 7.0,
          language: 'Español',
          file_name: session.file_name,
          file_size: session.file_size,
          channel_message_id: session.channel_message_id,
          channel_username: CHANNEL_USERNAME,
          telegram_link: telegramLink,
          added_by: fullName
        })
        
        await deleteBotSession(chatId)
        
        if (savedMovie) {
          await sendMessage(chatId,
            `✅ *¡Película guardada!*\n\n` +
            `🎬 *${session.title}*\n` +
            `${cat?.emoji} ${cat?.name} | ${session.year}\n\n` +
            `🔗 *Link:* [Ver en Telegram](${telegramLink})\n\n` +
            `La película ya está disponible en Vertiflix.\n` +
            `Envía /nueva para agregar otra.`
          , removeKeyboard())
        } else {
          await sendMessage(chatId,
            `⚠️ *Error al guardar*\n\n` +
            `Hubo un problema al guardar la película. Intenta de nuevo.\n` +
            `Envía /nueva para reintentar.`
          , removeKeyboard())
        }
        return NextResponse.json({ ok: true })
      }
      
      if (text === '✏️ Editar') {
        await upsertBotSession(chatId, { step: 'waiting_title' })
        
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

// GET - Estado del sistema
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')
  
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  const supabase = getServerSupabase()
  
  const { count: moviesCount } = await supabase
    .from('telegram_movies')
    .select('*', { count: 'exact', head: true })
  
  const { count: sessionsCount } = await supabase
    .from('bot_sessions')
    .select('*', { count: 'exact', head: true })
  
  return NextResponse.json({ 
    ok: true,
    movies: moviesCount || 0,
    sessions: sessionsCount || 0,
    channel: CHANNEL_USERNAME
  })
}
