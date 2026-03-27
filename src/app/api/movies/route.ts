import { NextRequest, NextResponse } from 'next/server'
import { DEMO_MOVIES } from '@/lib/data'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

// Archivo local para almacenar películas
const DATA_FILE = path.join(process.cwd(), 'data', 'movies.json')

// Inicializar Firebase Admin
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

// Asegurar que el directorio existe
function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Leer películas del archivo local
function readMovies(): any[] {
  try {
    ensureDataDir()
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.log('Error reading movies file:', error)
  }
  return []
}

// Guardar películas en archivo local
function saveMovies(movies: any[]) {
  try {
    ensureDataDir()
    fs.writeFileSync(DATA_FILE, JSON.stringify(movies, null, 2))
  } catch (error) {
    console.log('Error saving movies file:', error)
  }
}

// Obtener películas de Telegram desde Firebase
async function getTelegramMovies(): Promise<any[]> {
  try {
    const database = getDb()
    const snapshot = await database
      .collection('telegram_movies')
      .where('approved', '==', true)
      .limit(100)
      .get()
    
    return snapshot.docs.map(doc => {
      const data = doc.data()
      
      // Extraer channel_username del telegram_link si no existe
      let channelUsername = data.channel_username
      let channelMessageId = data.channel_message_id
      
      if (!channelUsername && data.telegram_link) {
        // Parsear link: https://t.me/VertiflixVideos/123
        const match = data.telegram_link.match(/t\.me\/([a-zA-Z0-9_]+)\/(\d+)/)
        if (match) {
          channelUsername = match[1]
          channelMessageId = parseInt(match[2], 10)
        }
      }
      
      return {
        id: doc.id,
        title: data.title || 'Sin título',
        description: data.description || '',
        thumbnail: data.thumbnail || data.image_url || 'https://picsum.photos/500/750',
        videoUrl: null, // NO usar link de Telegram directamente
        category: data.category || 'otros',
        year: data.year || 2024,
        duration: data.duration || 120,
        rating: data.rating || 7.0,
        featured: false,
        language: data.language || 'Español',
        // ✅ CAMPOS PARA MTPROTO STREAMING
        channelUsername: channelUsername,
        channelMessageId: channelMessageId,
        source: 'telegram',
        createdAt: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
        updatedAt: data.updated_at?.toDate ? data.updated_at.toDate() : data.updated_at
      }
    })
  } catch (error) {
    console.error('Error getting telegram movies:', error)
    return []
  }
}

// GET - Todas las películas (locales + Telegram)
export async function GET() {
  try {
    // Obtener películas locales
    const localMovies = readMovies()
    
    // Obtener películas de Telegram
    const telegramMovies = await getTelegramMovies()
    
    // Combinar ambas fuentes
    const allMovies = [...localMovies, ...telegramMovies]
    
    if (allMovies.length > 0) {
      return NextResponse.json({ movies: allMovies })
    }
    
    // Si no hay películas, usar DEMO_MOVIES
    const demoMoviesWithSource = DEMO_MOVIES.map(m => ({ ...m, source: 'demo' }))
    saveMovies(demoMoviesWithSource)
    return NextResponse.json({ movies: demoMoviesWithSource })
    
  } catch (error) {
    console.error('Error fetching movies:', error)
    return NextResponse.json({ movies: DEMO_MOVIES })
  }
}

// POST - Crear película
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    if (body.adminPassword !== adminPassword) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const movies = readMovies()
    
    const newMovie = {
      id: Date.now().toString(),
      title: body.title || 'Sin título',
      description: body.description || '',
      thumbnail: body.thumbnail || 'https://picsum.photos/500/750',
      videoUrl: body.videoUrl || null,
      category: body.category || 'otros',
      year: body.year || 2024,
      duration: body.duration || 120,
      rating: body.rating || 7.0,
      featured: body.featured || false,
      language: body.language || 'Español',
      // Telegram MTProto streaming
      channelUsername: body.channelUsername || null,
      channelMessageId: body.channelMessageId ? parseInt(body.channelMessageId) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'local'
    }
    
    movies.unshift(newMovie)
    saveMovies(movies)
    
    return NextResponse.json({ movie: newMovie, success: true })
  } catch (error) {
    console.error('Error creating movie:', error)
    return NextResponse.json({ error: 'Error al crear' }, { status: 500 })
  }
}

// PUT - Actualizar película
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    if (body.adminPassword !== adminPassword) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const movies = readMovies()
    const index = movies.findIndex(m => m.id === body.id)
    
    if (index === -1) {
      return NextResponse.json({ error: 'Película no encontrada' }, { status: 404 })
    }
    
    movies[index] = {
      ...movies[index],
      ...body,
      channelMessageId: body.channelMessageId ? parseInt(body.channelMessageId) : null,
      updatedAt: new Date().toISOString()
    }
    
    saveMovies(movies)
    
    return NextResponse.json({ movie: movies[index], success: true })
  } catch (error) {
    console.error('Error updating movie:', error)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

// DELETE - Eliminar película
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('id')
    const password = searchParams.get('password')
    
    if (password !== (process.env.ADMIN_PASSWORD || 'admin123')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    if (!movieId) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }
    
    const movies = readMovies()
    const filtered = movies.filter(m => m.id !== movieId)
    saveMovies(filtered)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting movie:', error)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
