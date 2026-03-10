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

// Tipos para la base de datos
export interface Database {
  public: {
    Tables: {
      movies: {
        Row: {
          id: string
          title: string
          description: string
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
        Insert: {
          id?: string
          title: string
          description?: string
          thumbnail?: string
          video_url?: string
          category?: string
          year?: number
          duration?: number
          rating?: number
          featured?: boolean
          language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          thumbnail?: string
          video_url?: string
          category?: string
          year?: number
          duration?: number
          rating?: number
          featured?: boolean
          language?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Schema SQL para crear la tabla movies en Supabase:
/*
CREATE TABLE movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  video_url TEXT,
  category TEXT DEFAULT 'otros',
  year INTEGER DEFAULT 2024,
  duration INTEGER DEFAULT 0,
  rating DECIMAL(3,1) DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'Español',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública
CREATE POLICY "Movies are viewable by everyone" ON movies
  FOR SELECT USING (true);

-- Política para inserción (solo admin - verificar con tu lógica)
CREATE POLICY "Admins can insert movies" ON movies
  FOR INSERT WITH CHECK (true);

-- Política para actualización (solo admin)
CREATE POLICY "Admins can update movies" ON movies
  FOR UPDATE USING (true);

-- Política para eliminación (solo admin)
CREATE POLICY "Admins can delete movies" ON movies
  FOR DELETE USING (true);

-- Índices para mejor rendimiento
CREATE INDEX idx_movies_category ON movies(category);
CREATE INDEX idx_movies_featured ON movies(featured);
CREATE INDEX idx_movies_rating ON movies(rating DESC);
*/
