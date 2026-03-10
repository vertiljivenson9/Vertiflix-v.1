-- =====================================================
-- VERTIFLIX - SCHEMA COMPLETO PARA SUPABASE
-- =====================================================
-- Ejecuta este script en el SQL Editor de Supabase
-- =====================================================

-- =====================================================
-- 1. TABLA DE PELÍCULAS (principal)
-- =====================================================
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

-- =====================================================
-- 2. TABLA DE PELÍCULAS DE TELEGRAM
-- =====================================================
CREATE TABLE IF NOT EXISTS telegram_movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  
  -- Información del video en Telegram
  video_url TEXT,
  file_id TEXT,
  thumbnail_file_id TEXT,
  
  -- Metadatos
  category TEXT DEFAULT 'otros',
  year INTEGER DEFAULT 2024,
  duration INTEGER DEFAULT 120,
  rating DECIMAL(3,1) DEFAULT 7.0,
  language TEXT DEFAULT 'Español',
  
  -- Información del archivo
  file_name TEXT,
  file_size BIGINT,
  
  -- Para reproducción en Telegram
  channel_message_id BIGINT,
  channel_username TEXT DEFAULT 'VertiflixVideos',
  telegram_link TEXT,
  
  -- Metadata
  added_by TEXT,
  approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABLA DE SESIONES DEL BOT
-- =====================================================
CREATE TABLE IF NOT EXISTS bot_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL UNIQUE,
  step TEXT DEFAULT 'waiting_video',
  
  -- Video
  video_file_id TEXT,
  video_message_id BIGINT,
  channel_message_id BIGINT,
  
  -- Imagen
  image_file_id TEXT,
  image_url TEXT,
  
  -- Metadata
  title TEXT,
  year INTEGER,
  category TEXT,
  duration INTEGER DEFAULT 120,
  file_name TEXT,
  file_size BIGINT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABLA DE USUARIOS (para el futuro)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  favorites TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 5. ÍNDICES PARA RENDIMIENTO
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_movies_category ON movies(category);
CREATE INDEX IF NOT EXISTS idx_movies_featured ON movies(featured);
CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating DESC);
CREATE INDEX IF NOT EXISTS idx_movies_created ON movies(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tg_movies_category ON telegram_movies(category);
CREATE INDEX IF NOT EXISTS idx_tg_movies_approved ON telegram_movies(approved);
CREATE INDEX IF NOT EXISTS idx_tg_movies_created ON telegram_movies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tg_movies_channel ON telegram_movies(channel_message_id);

CREATE INDEX IF NOT EXISTS idx_sessions_chat ON bot_sessions(chat_id);
CREATE INDEX IF NOT EXISTS idx_sessions_step ON bot_sessions(step);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas para movies (lectura pública)
CREATE POLICY "Movies - Public read" ON movies
  FOR SELECT USING (true);

CREATE POLICY "Movies - Service role write" ON movies
  FOR ALL USING (auth.role() = 'service_role');

-- Políticas para telegram_movies (lectura pública)
CREATE POLICY "TG Movies - Public read" ON telegram_movies
  FOR SELECT USING (true);

CREATE POLICY "TG Movies - Service role write" ON telegram_movies
  FOR ALL USING (auth.role() = 'service_role');

-- Políticas para bot_sessions (solo service role)
CREATE POLICY "Sessions - Service role only" ON bot_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Políticas para users
CREATE POLICY "Users - Public read own" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users - Service role write" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 7. FUNCIONES ÚTILES
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_movies_updated_at
  BEFORE UPDATE ON movies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tg_movies_updated_at
  BEFORE UPDATE ON telegram_movies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON bot_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. VISTAS ÚTILES
-- =====================================================

-- Vista combinada de todas las películas
CREATE OR REPLACE VIEW all_movies AS
SELECT 
  'local' as source,
  id, title, description, thumbnail, video_url, 
  category, year, duration, rating, featured, language,
  NULL as telegram_link, NULL as channel_message_id,
  created_at, updated_at
FROM movies
UNION ALL
SELECT 
  'telegram' as source,
  id, title, description, thumbnail, video_url,
  category, year, duration, rating, false as featured, language,
  telegram_link, channel_message_id,
  created_at, updated_at
FROM telegram_movies
WHERE approved = true
ORDER BY created_at DESC;

-- =====================================================
-- 9. DATOS DE EJEMPLO (opcional, descomenta si quieres)
-- =====================================================
/*
INSERT INTO movies (title, description, thumbnail, video_url, category, year, duration, rating, featured, language)
VALUES 
  ('Dune: Parte Dos', 'Paul Atreides se une a los Fremen...', 
   'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
   'https://youtube.com/watch?v=example',
   'ciencia-ficcion', 2024, 166, 8.5, true, 'Español');
*/

-- =====================================================
-- ¡LISTO! Ejecuta esto en Supabase SQL Editor
-- =====================================================
