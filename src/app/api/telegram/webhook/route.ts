import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

// Almacenamiento en memoria (en producción usar DB)
interface MovieFromBot {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl: string
  fileId?: string
  category: string
  year: number
  duration: number
  rating: number
  language: string
  addedBy: string
  addedAt: Date
}

const moviesFromBot: MovieFromBot[] = []

// Thumbnals por defecto según categoría
const defaultThumbnails: Record<string, string> = {
  'accion': 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
  'drama': 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
  'comedia': 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
  'terror': 'https://image.tmdb.org/t/p/w500/qVKirUdmoex8SdfUk8WDM3AkfGP.jpg',
  'ciencia-ficcion': 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
  'anime': 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
  'serie': 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
  'otros': 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg'
}

// Enviar mensaje a Telegram
async function sendTelegramMessage(chatId: number | string, text: string, options?: Record<string, unknown>) {
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

// Obtener URL del archivo
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
    const text = message.text || ''
    const caption = message.caption || ''

    // ====== COMANDOS ======
    
    // /start
    if (text.startsWith('/start')) {
      await sendTelegramMessage(chatId,
        `🎬 *Vertiflix Bot*\n\n` +
        `¡Hola ${fromUser}! Este bot te permite agregar películas a tu plataforma Vertiflix.\n\n` +
        `*Cómo agregar películas:*\n` +
        `1. Envía un video directamente aquí\n` +
        `2. Escribe el título y descripción\n` +
        `3. La película se agrega automáticamente\n\n` +
        `*Comandos:*\n` +
        `/start - Ver este mensaje\n` +
        `/help - Ayuda\n` +
        `/list - Ver películas agregadas\n` +
        `/stats - Estadísticas`
      )
      return NextResponse.json({ ok: true })
    }

    // /help
    if (text.startsWith('/help')) {
      await sendTelegramMessage(chatId,
        `📚 *Ayuda de Vertiflix Bot*\n\n` +
        `*Agregar película con video:*\n` +
        `1. Envía el video\n` +
        `2. Añade título en la descripción:\n` +
        '   `Título: Nombre de la Película`\n' +
        '   `Año: 2024`\n' +
        '   `Categoría: accion`\n\n' +
        `*Categorías disponibles:*\n` +
        `accion, drama, comedia, terror, ciencia-ficcion, anime, serie, otros\n\n` +
        `*Agregar sin video:*\n` +
        `/add Título | Año | Categoría | URL_YouTube`
      )
      return NextResponse.json({ ok: true })
    }

    // /list
    if (text.startsWith('/list')) {
      if (moviesFromBot.length === 0) {
        await sendTelegramMessage(chatId, '📭 No hay películas agregadas todavía.\n\nEnvía un video para agregar la primera.')
      } else {
        let list = `🎬 *Películas agregadas (${moviesFromBot.length}):*\n\n`
        moviesFromBot.slice(0, 10).forEach((m, i) => {
          list += `${i + 1}. *${m.title}*\n   📅 ${m.year} | 📁 ${m.category}\n`
        })
        if (moviesFromBot.length > 10) {
          list += `\n_...y ${moviesFromBot.length - 10} más._`
        }
        await sendTelegramMessage(chatId, list)
      }
      return NextResponse.json({ ok: true })
    }

    // /stats
    if (text.startsWith('/stats')) {
      const byCategory: Record<string, number> = {}
      moviesFromBot.forEach(m => {
        byCategory[m.category] = (byCategory[m.category] || 0) + 1
      })
      
      let stats = `📊 *Estadísticas de Vertiflix*\n\n` +
        `🎬 Total películas: *${moviesFromBot.length}*\n\n` +
        `*Por categoría:*\n`
      
      Object.entries(byCategory).forEach(([cat, count]) => {
        stats += `• ${cat}: ${count}\n`
      })
      
      await sendTelegramMessage(chatId, stats)
      return NextResponse.json({ ok: true })
    }

    // /add manual
    if (text.startsWith('/add ')) {
      const parts = text.replace('/add ', '').split('|').map(s => s.trim())
      
      if (parts.length >= 4) {
        const title = parts[0]
        const year = parseInt(parts[1]) || 2024
        const category = parts[2].toLowerCase() || 'otros'
        const videoUrl = parts[3]
        
        const movie: MovieFromBot = {
          id: `bot_${Date.now()}`,
          title,
          description: `Agregado vía Telegram por ${fromUser}`,
          thumbnail: defaultThumbnails[category] || defaultThumbnails['otros'],
          videoUrl,
          category,
          year,
          duration: 120,
          rating: 7.0,
          language: 'Español',
          addedBy: fromUser,
          addedAt: new Date()
        }
        
        moviesFromBot.push(movie)
        
        await sendTelegramMessage(chatId,
          `✅ *Película agregada exitosamente!*\n\n` +
          `🎬 *${movie.title}*\n` +
          `📅 Año: ${movie.year}\n` +
          `📁 Categoría: ${movie.category}\n` +
          `🆔 ID: \`${movie.id}\`\n\n` +
          `_Aparecerá en tu panel de Vertiflix._`
        )
        return NextResponse.json({ ok: true })
      } else {
        await sendTelegramMessage(chatId,
          '❌ Formato incorrecto.\n\n' +
          'Usa: `/add Título | Año | Categoría | URL`\n' +
          'Ejemplo: `/add Dune 2 | 2024 | ciencia-ficcion | https://youtube.com/...`'
        )
        return NextResponse.json({ ok: true })
      }
    }

    // ====== VIDEO RECIBIDO ======
    if (message.video) {
      const video = message.video
      const fileId = video.file_id
      const duration = video.duration || 0
      
      // Extraer título del caption
      let title = caption.split('\n')[0].substring(0, 100) || `Video ${Date.now()}`
      let year = 2024
      let category = 'otros'
      
      // Parsear caption
      const captionLines = caption.toLowerCase().split('\n')
      captionLines.forEach(line => {
        if (line.includes('año:') || line.includes('year:')) {
          const y = line.match(/\d{4}/)
          if (y) year = parseInt(y[0])
        }
        if (line.includes('categoría:') || line.includes('categoria:') || line.includes('category:')) {
          const cat = line.split(':')[1]?.trim()
          if (cat) category = cat
        }
      })
      
      const movie: MovieFromBot = {
        id: `bot_${Date.now()}_${video.file_unique_id}`,
        title,
        description: caption || `Agregado vía Telegram por ${fromUser}`,
        thumbnail: defaultThumbnails[category] || defaultThumbnails['otros'],
        videoUrl: await getFileUrl(fileId),
        fileId,
        category,
        year,
        duration: Math.floor(duration / 60),
        rating: 7.0,
        language: 'Español',
        addedBy: fromUser,
        addedAt: new Date()
      }
      
      moviesFromBot.push(movie)
      
      await sendTelegramMessage(chatId,
        `✅ *Película recibida y agregada!*\n\n` +
        `🎬 *${movie.title}*\n` +
        `⏱ Duración: ${movie.duration} min\n` +
        `📅 Año: ${movie.year}\n` +
        `📁 Categoría: ${movie.category}\n` +
        `🆔 ID: \`${movie.id}\`\n\n` +
        `_Ver en Vertiflix para confirmar._\n\n` +
        `_Tip: Para mejor título, envía el video con esta descripción:_\n` +
        '```\n' +
        'Título de la Película\n' +
        'Año: 2024\n' +
        'Categoría: accion\n' +
        '```',
        { parse_mode: 'Markdown' }
      )
      
      return NextResponse.json({ ok: true })
    }

    // ====== DOCUMENTO RECIBIDO ======
    if (message.document) {
      const doc = message.document
      const fileName = doc.file_name || 'Archivo'
      const mimeType = doc.mime_type || ''
      
      // Verificar si es video
      if (mimeType.startsWith('video/') || fileName.match(/\.(mp4|mkv|avi|mov|webm)$/i)) {
        const fileId = doc.file_id
        
        let title = caption.split('\n')[0].substring(0, 100) || fileName.replace(/\.[^.]+$/, '')
        let year = 2024
        let category = 'otros'
        
        const captionLines = caption.toLowerCase().split('\n')
        captionLines.forEach(line => {
          if (line.includes('año:') || line.includes('year:')) {
            const y = line.match(/\d{4}/)
            if (y) year = parseInt(y[0])
          }
          if (line.includes('categoría:') || line.includes('categoria:') || line.includes('category:')) {
            const cat = line.split(':')[1]?.trim()
            if (cat) category = cat
          }
        })
        
        const movie: MovieFromBot = {
          id: `bot_${Date.now()}_${doc.file_unique_id}`,
          title,
          description: caption || `Agregado vía Telegram por ${fromUser}`,
          thumbnail: defaultThumbnails[category] || defaultThumbnails['otros'],
          videoUrl: await getFileUrl(fileId),
          fileId,
          category,
          year,
          duration: 120,
          rating: 7.0,
          language: 'Español',
          addedBy: fromUser,
          addedAt: new Date()
        }
        
        moviesFromBot.push(movie)
        
        await sendTelegramMessage(chatId,
          `✅ *Video recibido y agregado!*\n\n` +
          `🎬 *${movie.title}*\n` +
          `📁 Archivo: ${fileName}\n` +
          `📅 Año: ${movie.year}\n` +
          `🆔 ID: \`${movie.id}\``
        )
        
        return NextResponse.json({ ok: true })
      } else {
        await sendTelegramMessage(chatId, 
          '❌ Solo acepto archivos de video (MP4, MKV, AVI, MOV, WEBM)'
        )
        return NextResponse.json({ ok: true })
      }
    }

    // ====== TEXTO SIMPLE ======
    if (text && !text.startsWith('/')) {
      await sendTelegramMessage(chatId,
        '📥 Envía un video o usa un comando.\n\n' +
        'Comandos disponibles:\n' +
        '/start - Inicio\n' +
        '/help - Ayuda\n' +
        '/add - Agregar manual'
      )
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('Error en webhook:', error)
    return NextResponse.json({ ok: true })
  }
}

// GET - Obtener películas agregadas
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')
  
  // Validar admin password
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  return NextResponse.json({ 
    movies: moviesFromBot,
    total: moviesFromBot.length
  })
}
