import { NextRequest, NextResponse } from 'next/server'
import { getAllMovies, addMovie, deleteMovie, getServerSupabase } from '@/lib/supabase'
import { DEMO_MOVIES } from '@/lib/data'
import type { Movie } from '@/types'

export const runtime = 'nodejs'

// GET - Obtener todas las películas
export async function GET() {
  try {
    // Intentar obtener de Supabase
    const supabaseMovies = await getAllMovies()
    
    if (supabaseMovies && supabaseMovies.length > 0) {
      // Convertir a formato de la app
      const movies: Movie[] = supabaseMovies.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        title: m.title as string,
        description: m.description as string | null,
        thumbnail: m.thumbnail as string,
        videoUrl: (m.video_url || m.videoUrl) as string,
        category: m.category as string,
        year: m.year as number,
        duration: m.duration as number,
        rating: m.rating as number,
        featured: (m.featured as boolean) || false,
        language: (m.language as string) || 'Español',
        createdAt: new Date(m.created_at as string),
        updatedAt: new Date(m.updated_at as string),
        // Campos extra para Telegram
        telegramLink: m.telegram_link || m.telegramLink || null,
        channelMessageId: m.channel_message_id || m.channelMessageId || null,
        fileId: m.file_id || m.fileId || null,
      }))
      
      return NextResponse.json({ movies })
    }
    
    // Fallback a películas demo si no hay datos
    return NextResponse.json({ movies: DEMO_MOVIES })
    
  } catch (error) {
    console.error('Error fetching movies:', error)
    return NextResponse.json({ movies: DEMO_MOVIES })
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

    // Agregar a Supabase
    const saved = await addMovie({
      title: body.title,
      description: body.description || '',
      thumbnail: body.thumbnail || 'https://picsum.photos/500/750',
      video_url: body.videoUrl || body.video_url || '',
      category: body.category || 'otros',
      year: body.year || 2024,
      duration: body.duration || 0,
      rating: body.rating || 0,
      featured: body.featured || false,
      language: body.language || 'Español'
    })

    if (saved) {
      const newMovie: Movie = {
        id: saved.id,
        title: saved.title,
        description: saved.description,
        thumbnail: saved.thumbnail,
        videoUrl: saved.video_url,
        category: saved.category,
        year: saved.year,
        duration: saved.duration,
        rating: saved.rating,
        featured: saved.featured,
        language: saved.language,
        createdAt: new Date(saved.created_at),
        updatedAt: new Date(saved.updated_at),
      }
      
      return NextResponse.json({ movie: newMovie, success: true })
    }
    
    return NextResponse.json({ error: 'Error al crear película' }, { status: 500 })
    
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
    
    const supabase = getServerSupabase()
    
    // Intentar eliminar de movies
    let { error: error1 } = await supabase
      .from('movies')
      .delete()
      .eq('id', movieId)
    
    if (!error1) {
      return NextResponse.json({ success: true, source: 'movies' })
    }
    
    // Intentar eliminar de telegram_movies
    let { error: error2 } = await supabase
      .from('telegram_movies')
      .delete()
      .eq('id', movieId)
    
    if (!error2) {
      return NextResponse.json({ success: true, source: 'telegram_movies' })
    }
    
    return NextResponse.json({ error: 'Película no encontrada' }, { status: 404 })
    
  } catch (error) {
    console.error('Error deleting movie:', error)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
