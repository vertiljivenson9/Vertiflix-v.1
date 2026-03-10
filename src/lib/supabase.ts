import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Cliente para uso en el cliente (browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para uso en el servidor (con service role key)
export const getServerSupabase = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// =====================================================
// TIPOS PARA LA BASE DE DATOS
// =====================================================

export interface Movie {
  id: string
  title: string
  description: string | null
  thumbnail: string
  video_url: string
  category: string
  year: number
  duration: number
  rating: number
  featured: boolean
  language: string
  created_at: string
  updated_at: string
}

export interface TelegramMovie {
  id: string
  title: string
  description: string | null
  thumbnail: string
  
  // Video info
  video_url: string
  file_id: string | null
  thumbnail_file_id: string | null
  
  // Metadata
  category: string
  year: number
  duration: number
  rating: number
  language: string
  
  // File info
  file_name: string | null
  file_size: number | null
  
  // Telegram playback
  channel_message_id: number | null
  channel_username: string | null
  telegram_link: string | null
  
  // Admin
  added_by: string | null
  approved: boolean
  
  created_at: string
  updated_at: string
}

export interface BotSession {
  id: string
  chat_id: number
  step: string
  
  // Video
  video_file_id: string | null
  video_message_id: number | null
  channel_message_id: number | null
  
  // Image
  image_file_id: string | null
  image_url: string | null
  
  // Metadata
  title: string | null
  year: number | null
  category: string | null
  duration: number | null
  file_name: string | null
  file_size: number | null
  
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  telegram_id: number | null
  username: string | null
  first_name: string | null
  last_name: string | null
  is_admin: boolean
  favorites: string[]
  created_at: string
  last_login: string | null
}

// =====================================================
// FUNCIONES DE MOVIES
// =====================================================

// Obtener todas las películas (locales + telegram)
export async function getAllMovies() {
  const serverSupabase = getServerSupabase()
  
  // Obtener películas locales
  const { data: localMovies, error: error1 } = await serverSupabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false })
  
  // Obtener películas de Telegram aprobadas
  const { data: telegramMovies, error: error2 } = await serverSupabase
    .from('telegram_movies')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false })
  
  if (error1) console.error('Error fetching local movies:', error1)
  if (error2) console.error('Error fetching telegram movies:', error2)
  
  // Combinar y formatear
  const formatted: Movie[] = [
    ...(localMovies || []).map((m: Movie) => ({ ...m, videoUrl: m.video_url, source: 'local' })),
    ...(telegramMovies || []).map((m: TelegramMovie) => ({ 
      ...m, 
      videoUrl: m.video_url,
      telegramLink: m.telegram_link,
      channelMessageId: m.channel_message_id,
      source: 'telegram' 
    }))
  ]
  
  // Ordenar por fecha
  return formatted.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

// Agregar película de Telegram
export async function addTelegramMovie(movie: Partial<TelegramMovie>) {
  const serverSupabase = getServerSupabase()
  
  const { data, error } = await serverSupabase
    .from('telegram_movies')
    .insert([{
      title: movie.title,
      description: movie.description,
      thumbnail: movie.thumbnail,
      video_url: movie.video_url,
      file_id: movie.file_id,
      thumbnail_file_id: movie.thumbnail_file_id,
      category: movie.category || 'otros',
      year: movie.year || 2024,
      duration: movie.duration || 120,
      rating: movie.rating || 7.0,
      language: movie.language || 'Español',
      file_name: movie.file_name,
      file_size: movie.file_size,
      channel_message_id: movie.channel_message_id,
      channel_username: movie.channel_username || 'VertiflixVideos',
      telegram_link: movie.telegram_link,
      added_by: movie.added_by,
      approved: true
    }])
    .select()
    .single()
  
  if (error) {
    console.error('Error adding telegram movie:', error)
    return null
  }
  
  return data
}

// Eliminar película
export async function deleteMovie(id: string, table: 'movies' | 'telegram_movies' = 'telegram_movies') {
  const serverSupabase = getServerSupabase()
  
  const { error } = await serverSupabase
    .from(table)
    .delete()
    .eq('id', id)
  
  return !error
}

// =====================================================
// FUNCIONES DE SESIONES DEL BOT
// =====================================================

// Obtener sesión
export async function getBotSession(chatId: number) {
  const serverSupabase = getServerSupabase()
  
  const { data, error } = await serverSupabase
    .from('bot_sessions')
    .select('*')
    .eq('chat_id', chatId)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error getting session:', error)
  }
  
  return data as BotSession | null
}

// Crear o actualizar sesión
export async function upsertBotSession(chatId: number, updates: Partial<BotSession>) {
  const serverSupabase = getServerSupabase()
  
  const { data, error } = await serverSupabase
    .from('bot_sessions')
    .upsert({
      chat_id: chatId,
      ...updates
    }, { onConflict: 'chat_id' })
    .select()
    .single()
  
  if (error) {
    console.error('Error upserting session:', error)
    return null
  }
  
  return data as BotSession
}

// Eliminar sesión
export async function deleteBotSession(chatId: number) {
  const serverSupabase = getServerSupabase()
  
  const { error } = await serverSupabase
    .from('bot_sessions')
    .delete()
    .eq('chat_id', chatId)
  
  return !error
}

// =====================================================
// FUNCIONES DE PELÍCULAS LOCALES
// =====================================================

// Agregar película local
export async function addMovie(movie: Partial<Movie>) {
  const serverSupabase = getServerSupabase()
  
  const { data, error } = await serverSupabase
    .from('movies')
    .insert([{
      title: movie.title,
      description: movie.description,
      thumbnail: movie.thumbnail,
      video_url: movie.video_url,
      category: movie.category || 'otros',
      year: movie.year || 2024,
      duration: movie.duration || 0,
      rating: movie.rating || 0,
      featured: movie.featured || false,
      language: movie.language || 'Español'
    }])
    .select()
    .single()
  
  if (error) {
    console.error('Error adding movie:', error)
    return null
  }
  
  return data
}

// Actualizar película local
export async function updateMovie(id: string, updates: Partial<Movie>) {
  const serverSupabase = getServerSupabase()
  
  const { data, error } = await serverSupabase
    .from('movies')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating movie:', error)
    return null
  }
  
  return data
}
