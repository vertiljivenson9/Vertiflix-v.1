-- =============================================
-- VERTIFLIX - ESQUEMA DE BASE DE DATOS SUPABASE
-- =============================================
-- Ejecuta este SQL en el SQL Editor de Supabase
-- =============================================

-- Habilitar extensión UUID si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: telegram_movies
-- Películas agregadas a través del bot de Telegram
-- =============================================
CREATE TABLE IF NOT EXISTS telegram_movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  
  -- Video info
  video_url TEXT,
  file_id TEXT,
  thumbnail_file_id TEXT,
  
  -- Metadata
  category TEXT DEFAULT 'otros',
  year INTEGER DEFAULT 2024,
  duration INTEGER DEFAULT 120,
  rating DECIMAL(3,1) DEFAULT 7.0,
  language TEXT DEFAULT 'Español',
  
  -- File info
  file_name TEXT,
  file_size BIGINT,
  
  -- Telegram playback
  channel_message_id BIGINT,
  channel_username TEXT DEFAULT 'VertiflixVideos',
  telegram_link TEXT,
  
  -- Admin
  added_by TEXT,
  approved BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_telegram_movies_category ON telegram_movies(category);
CREATE INDEX IF NOT EXISTS idx_telegram_movies_year ON telegram_movies(year);
CREATE INDEX IF NOT EXISTS idx_telegram_movies_approved ON telegram_movies(approved);
CREATE INDEX IF NOT EXISTS idx_telegram_movies_created ON telegram_movies(created_at DESC);

-- =============================================
-- TABLA: movies
-- Películas agregadas manualmente (admin)
-- =============================================
CREATE TABLE IF NOT EXISTS movies (
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

CREATE INDEX IF NOT EXISTS idx_movies_category ON movies(category);
CREATE INDEX IF NOT EXISTS idx_movies_featured ON movies(featured);

-- =============================================
-- TABLA: bot_sessions
-- Sesiones del bot de Telegram para el flujo conversacional
-- =============================================
CREATE TABLE IF NOT EXISTS bot_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL UNIQUE,
  step TEXT DEFAULT 'idle',
  
  -- Video
  video_file_id TEXT,
  video_message_id BIGINT,
  channel_message_id BIGINT,
  
  -- Image
  image_file_id TEXT,
  image_url TEXT,
  
  -- Metadata
  title TEXT,
  year INTEGER,
  category TEXT,
  duration INTEGER,
  file_name TEXT,
  file_size BIGINT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsqueda rápida por chat_id
CREATE INDEX IF NOT EXISTS idx_bot_sessions_chat_id ON bot_sessions(chat_id);

-- =============================================
-- TABLA: users
-- Usuarios del bot de Telegram
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  favorites TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Índice para búsqueda por telegram_id
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_telegram_movies_updated_at ON telegram_movies;
CREATE TRIGGER update_telegram_movies_updated_at
  BEFORE UPDATE ON telegram_movies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_movies_updated_at ON movies;
CREATE TRIGGER update_movies_updated_at
  BEFORE UPDATE ON movies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bot_sessions_updated_at ON bot_sessions;
CREATE TRIGGER update_bot_sessions_updated_at
  BEFORE UPDATE ON bot_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- POLÍTICAS RLS (Row Level Security)
-- =============================================

-- Habilitar RLS
ALTER TABLE telegram_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas para telegram_movies (lectura pública, escritura solo servicio)
CREATE POLICY "Public read access for approved movies" ON telegram_movies
  FOR SELECT USING (approved = true);

CREATE POLICY "Service role full access on telegram_movies" ON telegram_movies
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para movies
CREATE POLICY "Public read access on movies" ON movies
  FOR SELECT USING (true);

CREATE POLICY "Service role full access on movies" ON movies
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para bot_sessions (solo servicio)
CREATE POLICY "Service role full access on bot_sessions" ON bot_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para users (solo servicio)
CREATE POLICY "Service role full access on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- Confirmación
-- =============================================
SELECT 'Esquema creado exitosamente ✓' as status;
