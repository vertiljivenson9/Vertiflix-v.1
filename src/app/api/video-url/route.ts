import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase'

export const runtime = 'nodejs'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

interface TelegramFileResponse {
  ok: boolean
  result?: {
    file_id: string
    file_unique_id: string
    file_size: number
    file_path: string
  }
}

// Obtener URL directa del archivo de video de Telegram
async function getTelegramFileUrl(fileId: string): Promise<{ url: string; expires: number } | null> {
  if (!BOT_TOKEN) return null
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    )
    
    const data: TelegramFileResponse = await response.json()
    
    if (data.ok && data.result?.file_path) {
      // La URL directa del CDN de Telegram
      const directUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`
      
      // Las URLs de Telegram expiran, pero normalmente duran ~1 hora
      return {
        url: directUrl,
        expires: Date.now() + (60 * 60 * 1000) // 1 hora
      }
    }
  } catch (error) {
    console.error('Error getting Telegram file URL:', error)
  }
  
  return null
}

// GET - Obtener URL del video por ID de película
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const movieId = searchParams.get('movieId')
  const fileId = searchParams.get('fileId')
  
  // Si pasan el file_id directamente
  if (fileId) {
    const result = await getTelegramFileUrl(fileId)
    
    if (result) {
      return NextResponse.json({
        success: true,
        url: result.url,
        expires: result.expires
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'No se pudo obtener la URL del video'
    }, { status: 404 })
  }
  
  // Si pasan el movie_id, buscar en la base de datos
  if (!movieId) {
    return NextResponse.json({
      success: false,
      error: 'Se requiere movieId o fileId'
    }, { status: 400 })
  }
  
  const supabase = getServerSupabase()
  
  // Buscar en telegram_movies
  const { data: movie, error } = await supabase
    .from('telegram_movies')
    .select('file_id, video_url, telegram_link')
    .eq('id', movieId)
    .single()
  
  if (error || !movie) {
    return NextResponse.json({
      success: false,
      error: 'Película no encontrada'
    }, { status: 404 })
  }
  
  // Si tenemos el file_id, obtener la URL directa
  if (movie.file_id) {
    const result = await getTelegramFileUrl(movie.file_id)
    
    if (result) {
      return NextResponse.json({
        success: true,
        url: result.url,
        expires: result.expires,
        source: 'telegram_cdn'
      })
    }
  }
  
  // Fallback: devolver el link de Telegram
  return NextResponse.json({
    success: true,
    url: movie.telegram_link || movie.video_url,
    source: 'telegram_link',
    note: 'URL directa no disponible, usando link de Telegram'
  })
}
