import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

// Archivo local para almacenar películas
const DATA_FILE = path.join(process.cwd(), 'data', 'movies.json')

// Leer películas del archivo local
function readMovies(): any[] {
  try {
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
    const dataDir = path.dirname(DATA_FILE)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(movies, null, 2))
  } catch (error) {
    console.log('Error saving movies file:', error)
  }
}

// GET - Obtener una película por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const movies = readMovies()
    const movie = movies.find(m => m.id === id)

    if (!movie) {
      return NextResponse.json({ error: 'Película no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ movie })
  } catch (error) {
    console.error('Error fetching movie:', error)
    return NextResponse.json({ error: 'Error al obtener película' }, { status: 500 })
  }
}

// PUT - Actualizar película
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Validar contraseña de admin
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    if (body.adminPassword !== adminPassword) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const movies = readMovies()
    const index = movies.findIndex(m => m.id === id)
    
    if (index === -1) {
      return NextResponse.json({ error: 'Película no encontrada' }, { status: 404 })
    }

    // Actualizar película
    movies[index] = {
      ...movies[index],
      title: body.title,
      description: body.description,
      thumbnail: body.thumbnail,
      videoUrl: body.videoUrl || body.video_url,
      category: body.category,
      year: body.year,
      duration: body.duration,
      rating: body.rating,
      featured: body.featured,
      language: body.language,
      updatedAt: new Date().toISOString(),
    }
    
    saveMovies(movies)

    return NextResponse.json({ movie: movies[index], success: true })
  } catch (error) {
    console.error('Error updating movie:', error)
    return NextResponse.json({ error: 'Error al actualizar película' }, { status: 500 })
  }
}

// DELETE - Eliminar película
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const adminPassword = searchParams.get('password')
    
    // Validar contraseña de admin
    const validPassword = process.env.ADMIN_PASSWORD || 'admin123'
    if (adminPassword !== validPassword) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const movies = readMovies()
    const filtered = movies.filter(m => m.id !== id)
    
    if (filtered.length === movies.length) {
      return NextResponse.json({ error: 'Película no encontrada' }, { status: 404 })
    }
    
    saveMovies(filtered)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting movie:', error)
    return NextResponse.json({ error: 'Error al eliminar película' }, { status: 500 })
  }
}
