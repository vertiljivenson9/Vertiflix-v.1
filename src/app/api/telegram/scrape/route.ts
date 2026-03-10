import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

interface ChannelInfo {
  id: number
  title: string
  username: string
  description?: string
  member_count?: number
}

interface TelegramMessage {
  message_id: number
  date: number
  text?: string
  caption?: string
  video?: {
    file_id: string
    duration: number
    width: number
    height: number
  }
  document?: {
    file_id: string
    file_name?: string
    mime_type?: string
  }
  photo?: Array<{ file_id: string; width: number; height: number }>
}

// Extraer username del canal
function extractChannelUsername(url: string): string | null {
  const patterns = [
    /t\.me\/\+([a-zA-Z0-9_-]+)/,
    /t\.me\/s\/([a-zA-Z0-9_]+)/,
    /t\.me\/([a-zA-Z0-9_]+)/,
    /^@([a-zA-Z0-9_]+)/,
    /^([a-zA-Z0-9_]{5,32})$/
  ]
  
  for (const pattern of patterns) {
    const match = url.trim().match(pattern)
    if (match) return match[1]
  }
  return null
}

// Scrapear canal usando la API de Telegram
async function scrapeChannelWithBot(channelUsername: string, limit: number = 20) {
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN no configurado')
  }
  
  try {
    // Obtener info del canal
    const chatInfoUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=@${channelUsername}`
    const chatResponse = await fetch(chatInfoUrl)
    const chatData = await chatResponse.json()
    
    if (!chatData.ok) {
      // Intentar sin @
      const chatInfoUrl2 = `https://api.telegram.org/bot${BOT_TOKEN}/getChat?chat_id=${channelUsername}`
      const chatResponse2 = await fetch(chatInfoUrl2)
      const chatData2 = await chatResponse2.json()
      
      if (!chatData2.ok) {
        throw new Error('No se puede acceder al canal. Asegúrate de que el bot es administrador del canal.')
      }
    }
    
    // Obtener mensajes (solo si el bot es admin)
    // Nota: getChatHistory requiere ser admin, así que usamos método alternativo
    
    // Generar películas de demostración basadas en el canal
    // En producción, necesitarías usar GramJS o que el bot sea admin
    const movies = generateDemoMovies(channelUsername, limit)
    
    return {
      success: true,
      channelName: `@${channelUsername}`,
      movies,
      total: movies.length,
      note: 'Modo demo. Para scraping real, agrega el bot como administrador del canal.'
    }
    
  } catch (error) {
    console.error('Error scraping channel:', error)
    throw error
  }
}

// Generar películas de demostración
function generateDemoMovies(channel: string, count: number) {
  const movieTitles = [
    { title: 'Dune: Parte Dos', year: 2024, rating: 8.8, genre: 'ciencia-ficcion' },
    { title: 'Oppenheimer', year: 2023, rating: 8.9, genre: 'drama' },
    { title: 'Spider-Man: Cruzando el Multiverso', year: 2023, rating: 8.7, genre: 'animacion' },
    { title: 'John Wick 4', year: 2023, rating: 8.2, genre: 'accion' },
    { title: 'Barbie', year: 2023, rating: 7.0, genre: 'comedia' },
    { title: 'Killers of the Flower Moon', year: 2023, rating: 8.5, genre: 'drama' },
    { title: 'Guardianes de la Galaxia Vol. 3', year: 2023, rating: 8.0, genre: 'ciencia-ficcion' },
    { title: 'The Batman', year: 2022, rating: 8.1, genre: 'accion' },
    { title: 'Top Gun: Maverick', year: 2022, rating: 8.3, genre: 'accion' },
    { title: 'Avatar: El Camino del Agua', year: 2022, rating: 7.9, genre: 'ciencia-ficcion' },
    { title: 'Demon Slayer: Tren Infinito', year: 2020, rating: 8.6, genre: 'anime' },
    { title: 'Jujutsu Kaisen 0', year: 2021, rating: 8.4, genre: 'anime' },
    { title: 'One Piece Film: Red', year: 2022, rating: 8.0, genre: 'anime' },
    { title: 'Your Name', year: 2016, rating: 8.9, genre: 'anime' },
    { title: 'Spirited Away', year: 2001, rating: 9.0, genre: 'anime' },
    { title: 'Interstellar', year: 2014, rating: 8.7, genre: 'ciencia-ficcion' },
    { title: 'Inception', year: 2010, rating: 8.8, genre: 'ciencia-ficcion' },
    { title: 'Parasite', year: 2019, rating: 8.6, genre: 'drama' },
    { title: 'Joker', year: 2019, rating: 8.4, genre: 'drama' },
    { title: 'Avengers: Endgame', year: 2019, rating: 8.4, genre: 'accion' },
    { title: 'The Last of Us', year: 2023, rating: 8.8, genre: 'serie' },
    { title: 'House of the Dragon', year: 2022, rating: 8.5, genre: 'serie' },
    { title: 'Wednesday', year: 2022, rating: 8.3, genre: 'serie' },
    { title: 'Breaking Bad', year: 2008, rating: 9.5, genre: 'serie' },
    { title: 'Game of Thrones', year: 2011, rating: 9.3, genre: 'serie' },
  ]

  const thumbnails = [
    'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
    'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
    'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
    'https://image.tmdb.org/t/p/w500/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg',
    'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
    'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fber9Tav5PXS5qG4.jpg',
  ]

  return movieTitles.slice(0, count).map((movie, index) => ({
    id: `tg_${channel}_${Date.now()}_${index}`,
    title: movie.title,
    description: `Importado desde @${channel}. ${movie.genre.toUpperCase()}`,
    thumbnail: thumbnails[index % thumbnails.length],
    videoUrl: `https://t.me/${channel}/${1000 + index}`,
    sourceChannel: `@${channel}`,
    category: movie.genre,
    year: movie.year,
    duration: Math.floor(Math.random() * 60) + 90,
    rating: movie.rating,
    featured: false,
    language: 'Español',
    selected: true
  }))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channelUrl, limit = 20, adminPassword } = body

    // Validar contraseña
    const validPassword = process.env.ADMIN_PASSWORD || 'admin123'
    if (adminPassword !== validPassword) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!channelUrl) {
      return NextResponse.json({ error: 'URL de canal requerida' }, { status: 400 })
    }

    const channelUsername = extractChannelUsername(channelUrl)
    
    if (!channelUsername) {
      return NextResponse.json({ 
        error: 'URL de canal inválida. Usa: https://t.me/nombre_canal o @nombre_canal' 
      }, { status: 400 })
    }

    const result = await scrapeChannelWithBot(channelUsername, limit)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error al scrapear canal' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const channelUrl = searchParams.get('channel')
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!channelUrl) {
    return NextResponse.json({ 
      error: 'Parámetro channel requerido',
      usage: '?channel=https://t.me/nombre_canal'
    }, { status: 400 })
  }

  try {
    const channelUsername = extractChannelUsername(channelUrl)
    if (!channelUsername) {
      return NextResponse.json({ error: 'URL de canal inválida' }, { status: 400 })
    }

    const result = await scrapeChannelWithBot(channelUsername, limit)
    return NextResponse.json(result)
    
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Error' 
    }, { status: 500 })
  }
}
