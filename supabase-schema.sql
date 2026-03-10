-- ==========================================
-- VERTIFLIX - Schema de Base de Datos Supabase
-- ==========================================
-- Ejecuta este SQL en el SQL Editor de Supabase
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Crear tabla de películas
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

-- Habilitar Row Level Security
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver películas
CREATE POLICY "Movies are viewable by everyone" ON movies
  FOR SELECT USING (true);

-- Política: Admins pueden insertar (abierta para desarrollo)
CREATE POLICY "Admins can insert movies" ON movies
  FOR INSERT WITH CHECK (true);

-- Política: Admins pueden actualizar
CREATE POLICY "Admins can update movies" ON movies
  FOR UPDATE USING (true);

-- Política: Admins pueden eliminar
CREATE POLICY "Admins can delete movies" ON movies
  FOR DELETE USING (true);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_movies_category ON movies(category);
CREATE INDEX IF NOT EXISTS idx_movies_featured ON movies(featured);
CREATE INDEX IF NOT EXISTS idx_movies_rating ON movies(rating DESC);
CREATE INDEX IF NOT EXISTS idx_movies_year ON movies(year DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_movies_updated_at ON movies;
CREATE TRIGGER update_movies_updated_at
    BEFORE UPDATE ON movies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- DATOS DE EJEMPLO (Opcional)
-- ==========================================

INSERT INTO movies (title, description, thumbnail, video_url, category, year, duration, rating, featured, language) VALUES
('Dune: Parte Dos', 'Paul Atreides se une a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.', 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg', 'https://www.youtube.com/embed/Way9DexnyUs', 'ciencia-ficcion', 2024, 166, 8.8, true, 'Español'),
('Oppenheimer', 'La historia del físico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica.', 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg', 'https://www.youtube.com/embed/uYPbbksJxIg', 'drama', 2023, 180, 8.9, true, 'Español'),
('Spider-Man: Cruzando el Multiverso', 'Miles Morales regresa para una nueva aventura a través del multiverso.', 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', 'https://www.youtube.com/embed/shW9i6k8cB0', 'animacion', 2023, 140, 8.7, true, 'Español'),
('John Wick 4', 'John Wick descubre un camino para derrotar a La Mesa Alta.', 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg', 'https://www.youtube.com/embed/qEVUtrk8_B4', 'accion', 2023, 169, 8.2, false, 'Español'),
('Barbie', 'Barbie y Ken descubren las alegrías y peligros de vivir entre los humanos.', 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', 'https://www.youtube.com/embed/pBk4NYhWNMM', 'comedia', 2023, 114, 7.0, false, 'Español'),
('Pobres Criaturas', 'La historia de Bella Baxter, una joven resucitada por el científico Dr. Godwin Baxter.', 'https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg', 'https://www.youtube.com/embed/RlbR5N6veqw', 'drama', 2023, 141, 8.0, false, 'Español'),
('Misión Imposible: Sentencia Mortal', 'Ethan Hunt se enfrenta a su misión más peligrosa.', 'https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg', 'https://www.youtube.com/embed/avz06PDqDbM', 'accion', 2023, 163, 7.8, false, 'Español'),
('Guardianes de la Galaxia Vol. 3', 'Los Guardianes deben proteger a uno de los suyos.', 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg', 'https://www.youtube.com/embed/u3V5KDHRQvk', 'ciencia-ficcion', 2023, 150, 8.0, false, 'Español'),
('Wonka', 'La historia del joven Willy Wonka.', 'https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jtRCMwXJF.jpg', 'https://www.youtube.com/embed/otNh9bTjXWg', 'comedia', 2023, 116, 7.2, false, 'Español'),
('Aquaman y el Reino Perdido', 'Aquaman debe forjar una alianza para proteger Atlantis.', 'https://image.tmdb.org/t/p/w500/7lTnXOy0iNtBAdRP3TZvaKJ77F6.jpg', 'https://www.youtube.com/embed/UGc5Tzz19UY', 'accion', 2023, 124, 6.0, false, 'Español');

-- Verificar inserción
SELECT * FROM movies ORDER BY created_at DESC;
