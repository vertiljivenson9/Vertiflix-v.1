'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Zap, Rocket, Film, Ghost, Star, Heart, Globe, TrendingUp } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MovieHero from '@/components/movies/MovieHero'
import CategoryRow from '@/components/movies/CategoryRow'
import MovieModal from '@/components/movies/MovieModal'
import StreamPlayer from '@/components/player/StreamPlayer'
import AdminPanel from '@/components/admin/AdminPanel'
import { DEMO_MOVIES } from '@/lib/data'
import type { Movie } from '@/types'

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>(DEMO_MOVIES)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)

  // Load movies from API on mount
  useEffect(() => {
    fetch('/api/movies')
      .then(res => res.json())
      .then(data => {
        if (data.movies && data.movies.length > 0) {
          setMovies(data.movies)
        }
      })
      .catch(() => {})
  }, [])

  // Featured movie
  const featuredMovie = useMemo(() => {
    return movies.find(m => m.featured) || movies[0]
  }, [movies])

  // Filter movies by search
  const filteredMovies = useMemo(() => {
    if (!searchQuery) return movies
    const query = searchQuery.toLowerCase()
    return movies.filter(
      m => m.title.toLowerCase().includes(query) ||
           m.category.toLowerCase().includes(query) ||
           m.description?.toLowerCase().includes(query)
    )
  }, [searchQuery, movies])

  // Get movies by category
  const getMoviesByCategory = useCallback((category: string) => {
    if (category === 'todas') return movies
    return movies.filter(m => m.category === category)
  }, [movies])

  // Handle play
  const handlePlay = (movie: Movie) => {
    setPlayingMovie(movie)
    setSelectedMovie(null)
  }

  // Add movie
  const handleAddMovie = async (movieData: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMovie: Movie = {
      ...movieData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setMovies(prev => [...prev, newMovie])
    
    // Save to API
    await fetch('/api/movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...movieData, adminPassword: 'admin123' })
    })
  }

  // Update movie
  const handleUpdateMovie = async (id: string, movieData: Partial<Movie>) => {
    setMovies(prev => prev.map(m => m.id === id ? { ...m, ...movieData, updatedAt: new Date() } : m))
    
    await fetch(`/api/movies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...movieData, adminPassword: 'admin123' })
    })
  }

  // Delete movie
  const handleDeleteMovie = async (id: string) => {
    setMovies(prev => prev.filter(m => m.id !== id))
    
    await fetch(`/api/movies/${id}?password=admin123`, {
      method: 'DELETE'
    })
  }

  return (
    <main className="bg-[#141414] min-h-screen">
      <Navbar
        onSearch={setSearchQuery}
        onFavoritesClick={() => {}}
        onAdminClick={() => setShowAdmin(true)}
      />

      {!searchQuery && featuredMovie && (
        <MovieHero
          movie={featuredMovie}
          onPlay={() => handlePlay(featuredMovie)}
          onMoreInfo={() => setSelectedMovie(featuredMovie)}
        />
      )}

      <div className="-mt-32 relative z-10">
        {searchQuery ? (
          <div className="pt-40 px-4 md:px-12">
            <h2 className="text-white text-2xl font-bold mb-4">
              Resultados para &quot;{searchQuery}&quot;
            </h2>
            {filteredMovies.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredMovies.map(movie => (
                  <div
                    key={movie.id}
                    onClick={() => setSelectedMovie(movie)}
                    className="cursor-pointer group"
                  >
                    <div className="relative overflow-hidden rounded-md">
                      <img
                        src={movie.thumbnail}
                        alt={movie.title}
                        className="w-full aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-sm font-medium truncate">{movie.title}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No se encontraron resultados</p>
            )}
          </div>
        ) : (
          <>
            <CategoryRow title="Tendencias ahora" icon={<TrendingUp className="w-6 h-6 text-red-500" />} movies={movies.slice(0, 6)} onPlay={handlePlay} />
            <CategoryRow title="Top 10 en tu país" icon={<Star className="w-6 h-6 text-yellow-500" />} movies={[...movies].sort((a, b) => b.rating - a.rating).slice(0, 10)} onPlay={handlePlay} isTop10 />
            <CategoryRow title="Acción" icon={<Zap className="w-6 h-6 text-orange-500" />} movies={getMoviesByCategory('accion')} onPlay={handlePlay} />
            <CategoryRow title="Ciencia Ficción" icon={<Rocket className="w-6 h-6 text-blue-500" />} movies={getMoviesByCategory('ciencia-ficcion')} onPlay={handlePlay} />
            <CategoryRow title="Drama" icon={<Film className="w-6 h-6 text-purple-500" />} movies={getMoviesByCategory('drama')} onPlay={handlePlay} />
            <CategoryRow title="Comedia" icon={<Heart className="w-6 h-6 text-pink-500" />} movies={getMoviesByCategory('comedia')} onPlay={handlePlay} />
            <CategoryRow title="Terror" icon={<Ghost className="w-6 h-6 text-green-500" />} movies={getMoviesByCategory('terror')} onPlay={handlePlay} />
            <CategoryRow title="Anime" icon={<Star className="w-6 h-6 text-cyan-500" />} movies={getMoviesByCategory('anime')} onPlay={handlePlay} />
            <CategoryRow title="Series" icon={<Globe className="w-6 h-6 text-indigo-500" />} movies={getMoviesByCategory('serie')} onPlay={handlePlay} />
          </>
        )}
      </div>

      <Footer />

      <MovieModal movie={selectedMovie} onClose={() => setSelectedMovie(null)} onPlay={handlePlay} />

      {playingMovie && <StreamPlayer movie={playingMovie} onClose={() => setPlayingMovie(null)} />}

      <AdminPanel
        isOpen={showAdmin}
        onClose={() => setShowAdmin(false)}
        movies={movies}
        onAddMovie={handleAddMovie}
        onUpdateMovie={handleUpdateMovie}
        onDeleteMovie={handleDeleteMovie}
      />
    </main>
  )
}
