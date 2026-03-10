import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Almacenamiento temporal de películas (en producción usar Redis/DB)
const scrapedMovies: Map<string, unknown[]> = new Map()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Telegram Webhook:', JSON.stringify(body, null, 2))
    
    const message = body.message || body.channel_post
    
    if (!message) {
      return NextResponse.json({ ok: true })
    }

    const chatId = String(message.chat.id)
    const chatTitle = message.chat.title || message.chat.username || 'Canal'
    
    // Detectar video
    if (message.video || message.document) {
      const caption = message.caption || 'Sin título'
      const title = caption.split('\n')[0].substring(0, 100)
      
      const movie = {
        id: `tg_${Date.now()}_${message.message_id}`,
        title,
        description: caption,
        thumbnail: '',
        videoUrl: `https://t.me/${message.chat.username || 'c'}/${message.message_id}`,
        sourceChannel: chatTitle,
        messageId: String(message.message_id),
        date: new Date(message.date * 1000),
        hasMedia: true
      }
      
      if (!scrapedMovies.has(chatId)) {
        scrapedMovies.set(chatId, [])
      }
      scrapedMovies.get(chatId)?.push(movie)
      
      console.log(`Película detectada: ${title}`)
    }
    
    return NextResponse.json({ ok: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  const allMovies = Array.from(scrapedMovies.values()).flat()
  return NextResponse.json({ movies: allMovies, total: allMovies.length })
}
