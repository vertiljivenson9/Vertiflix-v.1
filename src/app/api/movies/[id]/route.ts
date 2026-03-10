import { NextRequest, NextResponse } from 'next/server'
import { DEMO_MOVIES } from '@/lib/data'
import type { Movie } from '@/types'

export const runtime = 'edge'

// Variable global para almacenar películas (compartida con route principal)
declare global {
  var moviesStore: Movie[] | undefined
}

// GET - Obtener una película por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Usar store en memoria o datos demo
    const movies = globalThis.moviesStore || DEMO_MOVIES
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

    // Inicializar store si no existe
    if (!globalThis.moviesStore) {
      globalThis.moviesStore = [...DEMO_MOVIES]
    }

    const index = globalThis.moviesStore.findIndex(m => m.id === id)
    if (index === -1) {
      return NextResponse.json({ error: 'Película no encontrada' }, { status: 404 })
    }

    // Actualizar película
    globalThis.moviesStore[index] = {
      ...globalThis.moviesStore[index],
      ...{
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
        updatedAt: new Date(),
      }
    }

    return NextResponse.json({ movie: globalThis.moviesStore[index], success: true })
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

    // Inicializar store si no existe
    if (!globalThis.moviesStore) {
      globalThis.moviesStore = [...DEMO_MOVIES]
    }

    const index = globalThis.moviesStore.findIndex(m => m.id === id)
    if (index === -1) {
      return NextResponse.json({ error: 'Película no encontrada' }, { status: 404 })
    }

    // Eliminar película
    globalThis.moviesStore.splice(index, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting movie:', error)
    return NextResponse.json({ error: 'Error al eliminar película' }, { status: 500 })
  }
}
