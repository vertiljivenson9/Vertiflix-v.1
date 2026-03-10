import { NextRequest, NextResponse } from 'next/server'
import { DEMO_MOVIES } from '@/lib/data'
import type { Movie } from '@/types'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

// Ruta del archivo de películas de Telegram
const DATA_DIR = path.join(process.cwd(), 'data')
const MOVIES_FILE = path.join(DATA_DIR, 'telegram-movies.json')

// Variable global para almacenar películas en memoria (demo)
let moviesStore: Movie[] = [...DEMO_MOVIES]

// Cargar películas de Telegram
function loadTelegramMovies(): Movie[] {
  try {
    if (fs.existsSync(MOVIES_FILE)) {
      const data = fs.readFileSync(MOVIES_FILE, 'utf-8')
      const tgMovies = JSON.parse(data)
      
      // Convertir a formato Movie y solo las aprobadas
      return tgMovies
        .filter((m: { approved: boolean }) => m.approved)
        .map((m: {
          id: string
          title: string
          description: string
          thumbnail: string
          videoUrl: string
          category: string
          year: number
          duration: number
          rating: number
          language: string
          addedAt: string
          telegramLink?: string
          channelMessageId?: number
          channelUsername?: string
          fileId?: string
        }) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          thumbnail: m.thumbnail,
          videoUrl: m.videoUrl,
          category: m.category,
          year: m.year,
          duration: m.duration,
          rating: m.rating,
          featured: false,
          language: m.language || 'Español',
          createdAt: new Date(m.addedAt || Date.now()),
          updatedAt: new Date(m.addedAt || Date.now()),
          // Campos para Telegram
          telegramLink: m.telegramLink,
          channelMessageId: m.channelMessageId,
          fileId: m.fileId,
        }))
    }
  } catch (error) {
    console.error('Error loading Telegram movies:', error)
  }
  return []
}

// GET - Obtener todas las películas
export async function GET() {
  try {
    // Cargar películas de Telegram
    const telegramMovies = loadTelegramMovies()
    
    // Combinar con películas demo/store
    const allMovies = [...moviesStore, ...telegramMovies]
    
    // Ordenar por fecha de creación (más recientes primero)
    allMovies.sort((a, b) => {
      const dateA = a.createdAt?.getTime() || 0
      const dateB = b.createdAt?.getTime() || 0
      return dateB - dateA
    })
    
    return NextResponse.json({ movies: allMovies })
  } catch (error) {
    console.error('Error fetching movies:', error)
    return NextResponse.json({ movies: moviesStore })
  }
}

// POST - Crear nueva película
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar contraseña de admin
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    if (body.adminPassword !== adminPassword) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const newMovie: Movie = {
      id: Date.now().toString(),
      title: body.title,
      description: body.description || '',
      thumbnail: body.thumbnail || 'https://picsum.photos/500/750',
      videoUrl: body.videoUrl || body.video_url || '',
      category: body.category || 'otros',
      year: body.year || 2024,
      duration: body.duration || 0,
      rating: body.rating || 0,
      featured: body.featured || false,
      language: body.language || 'Español',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Agregar a la tienda en memoria
    moviesStore.push(newMovie)

    return NextResponse.json({ movie: newMovie, success: true })
  } catch (error) {
    console.error('Error creating movie:', error)
    return NextResponse.json({ error: 'Error al crear película' }, { status: 500 })
  }
}

// DELETE - Eliminar película
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const movieId = searchParams.get('id')
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    const password = searchParams.get('password')
    
    if (password !== adminPassword) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    if (!movieId) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }
    
    // Buscar en memoria
    const index = moviesStore.findIndex(m => m.id === movieId)
    if (index !== -1) {
      moviesStore.splice(index, 1)
      return NextResponse.json({ success: true, source: 'memory' })
    }
    
    // Buscar en Telegram movies
    if (fs.existsSync(MOVIES_FILE)) {
      const data = fs.readFileSync(MOVIES_FILE, 'utf-8')
      const tgMovies = JSON.parse(data)
      const filteredMovies = tgMovies.filter((m: { id: string }) => m.id !== movieId)
      
      if (filteredMovies.length < tgMovies.length) {
        fs.writeFileSync(MOVIES_FILE, JSON.stringify(filteredMovies, null, 2))
        return NextResponse.json({ success: true, source: 'telegram' })
      }
    }
    
    return NextResponse.json({ error: 'Película no encontrada' }, { status: 404 })
  } catch (error) {
    console.error('Error deleting movie:', error)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
