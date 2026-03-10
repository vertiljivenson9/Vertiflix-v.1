import { NextRequest, NextResponse } from 'next/server'
import { DEMO_MOVIES } from '@/lib/data'
import type { Movie } from '@/types'

export const runtime = 'edge'

// Variable global para almacenar películas en memoria (demo)
// En producción, usar Supabase
let moviesStore: Movie[] = [...DEMO_MOVIES]

// GET - Obtener todas las películas
export async function GET() {
  try {
    // Por ahora usamos datos demo
    // Para usar Supabase, descomenta el código abajo y configura las variables de entorno
    /*
    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    const movies: Movie[] = data.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      thumbnail: m.thumbnail,
      videoUrl: m.video_url,
      category: m.category,
      year: m.year,
      duration: m.duration,
      rating: m.rating,
      featured: m.featured,
      language: m.language,
      createdAt: new Date(m.created_at),
      updatedAt: new Date(m.updated_at),
    }))
    */
    
    return NextResponse.json({ movies: moviesStore })
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

    /* Para usar Supabase:
    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from('movies')
      .insert({
        title: newMovie.title,
        description: newMovie.description,
        thumbnail: newMovie.thumbnail,
        video_url: newMovie.videoUrl,
        category: newMovie.category,
        year: newMovie.year,
        duration: newMovie.duration,
        rating: newMovie.rating,
        featured: newMovie.featured,
        language: newMovie.language,
      })
      .select()
      .single()
    
    if (error) throw error
    */

    return NextResponse.json({ movie: newMovie, success: true })
  } catch (error) {
    console.error('Error creating movie:', error)
    return NextResponse.json({ error: 'Error al crear película' }, { status: 500 })
  }
}
