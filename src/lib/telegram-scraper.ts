// Telegram Channel Scraper
// Extrae películas de canales de Telegram

export interface TelegramMovie {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl: string
  sourceChannel: string
  messageId: string
  views: number
  date: Date
  category?: string
  year?: number
  rating?: number
  hasMedia?: boolean
  selected?: boolean
}

export interface ScrapingResult {
  success: boolean
  movies: TelegramMovie[]
  total: number
  channelName: string
  error?: string
}

// Extraer username del canal desde URL
export function extractChannelUsername(url: string): string | null {
  const patterns = [
    /t\.me\/\+([a-zA-Z0-9_-]+)/,
    /t\.me\/([^\/\?]+)/,
    /^@([a-zA-Z0-9_]+)/,
    /^([a-zA-Z0-9_]{5,32})$/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Scrapear canal - genera películas de demostración
export async function scrapeTelegramChannel(
  channelUrl: string,
  limit: number = 20
): Promise<ScrapingResult> {
  const channelUsername = extractChannelUsername(channelUrl)
  
  if (!channelUsername) {
    return {
      success: false,
      movies: [],
      total: 0,
      channelName: '',
      error: 'URL de canal inválida'
    }
  }

  const movies = generateDemoMovies(channelUsername, limit)
  
  return {
    success: true,
    movies,
    total: movies.length,
    channelName: `@${channelUsername}`
  }
}

// Películas de demostración
function generateDemoMovies(channel: string, count: number): TelegramMovie[] {
  const sampleMovies = [
    { title: 'Dune: Parte Dos', year: 2024, genre: 'ciencia-ficcion', rating: 8.8 },
    { title: 'Oppenheimer', year: 2023, genre: 'drama', rating: 8.9 },
    { title: 'Spider-Man: Cruzando el Multiverso', year: 2023, genre: 'animacion', rating: 8.7 },
    { title: 'John Wick 4', year: 2023, genre: 'accion', rating: 8.2 },
    { title: 'Barbie', year: 2023, genre: 'comedia', rating: 7.0 },
    { title: 'Killers of the Flower Moon', year: 2023, genre: 'drama', rating: 8.5 },
    { title: 'Guardianes de la Galaxia Vol. 3', year: 2023, genre: 'ciencia-ficcion', rating: 8.0 },
    { title: 'The Batman', year: 2022, genre: 'accion', rating: 8.1 },
    { title: 'Top Gun: Maverick', year: 2022, genre: 'accion', rating: 8.3 },
    { title: 'Avatar: El Camino del Agua', year: 2022, genre: 'ciencia-ficcion', rating: 7.9 },
    { title: 'Demon Slayer: Tren Infinito', year: 2020, genre: 'anime', rating: 8.6 },
    { title: 'Jujutsu Kaisen 0', year: 2021, genre: 'anime', rating: 8.4 },
    { title: 'One Piece Film: Red', year: 2022, genre: 'anime', rating: 8.0 },
    { title: 'Your Name', year: 2016, genre: 'anime', rating: 8.9 },
    { title: 'Spirited Away', year: 2001, genre: 'anime', rating: 9.0 },
    { title: 'Interstellar', year: 2014, genre: 'ciencia-ficcion', rating: 8.7 },
    { title: 'Inception', year: 2010, genre: 'ciencia-ficcion', rating: 8.8 },
    { title: 'Parasite', year: 2019, genre: 'drama', rating: 8.6 },
    { title: 'Joker', year: 2019, genre: 'drama', rating: 8.4 },
    { title: 'Avengers: Endgame', year: 2019, genre: 'accion', rating: 8.4 },
    { title: 'Spider-Man: No Way Home', year: 2021, genre: 'accion', rating: 8.4 },
    { title: 'Get Out', year: 2017, genre: 'terror', rating: 7.8 },
    { title: 'Hereditary', year: 2018, genre: 'terror', rating: 7.3 },
    { title: 'The Last of Us', year: 2023, genre: 'serie', rating: 8.8 },
    { title: 'House of the Dragon', year: 2022, genre: 'serie', rating: 8.5 },
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
    'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
    'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
  ]

  return sampleMovies.slice(0, count).map((movie, index) => ({
    id: `tg_${Date.now()}_${index}`,
    title: movie.title,
    description: `Importado desde ${channel}. ${movie.genre} - ${movie.year}`,
    thumbnail: thumbnails[index % thumbnails.length],
    videoUrl: `https://t.me/${channel}/${1000 + index}`,
    sourceChannel: channel,
    messageId: `${1000 + index}`,
    views: Math.floor(Math.random() * 100000) + 5000,
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    category: movie.genre,
    year: movie.year,
    rating: movie.rating,
    hasMedia: true,
    selected: true
  }))
}
