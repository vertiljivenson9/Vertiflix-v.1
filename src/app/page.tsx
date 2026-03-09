'use client'

import { useState, useMemo } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import MovieHero from '@/components/movies/MovieHero'
import CategoryRow from '@/components/movies/CategoryRow'
import MovieModal from '@/components/movies/MovieModal'
import VideoPlayer from '@/components/player/VideoPlayer'
import { DEMO_MOVIES } from '@/lib/data'
import type { Movie } from '@/types'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [playingMovie, setPlayingMovie] = useState<Movie | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])

  // Featured movie (first one with featured=true or first in list)
  const featuredMovie = useMemo(() => {
    return DEMO_MOVIES.find(m => m.featured) || DEMO_MOVIES[0]
  }, [])

  // Filter movies by search
  const filteredMovies = useMemo(() => {
    if (!searchQuery) return DEMO_MOVIES
    const query = searchQuery.toLowerCase()
    return DEMO_MOVIES.filter(
      m => m.title.toLowerCase().includes(query) ||
           m.category.toLowerCase().includes(query) ||
           m.description?.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Get movies by category
  const getMoviesByCategory = (category: string) => {
    if (category === 'todas') return DEMO_MOVIES
    return DEMO_MOVIES.filter(m => m.category === category)
  }

  // Toggle favorite
  const toggleFavorite = (movieId: string) => {
    setFavorites(prev =>
      prev.includes(movieId)
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId]
    )
  }

  // Handle play
  const handlePlay = (movie: Movie) => {
    setPlayingMovie(movie)
    setSelectedMovie(null)
  }

  return (
    <main className="bg-[#141414] min-h-screen">
      {/* Navbar */}
      <Navbar
        onSearch={setSearchQuery}
        onFavoritesClick={() => {/* TODO: Show favorites modal */}}
      />

      {/* Hero Section */}
      {!searchQuery && (
        <MovieHero
          movie={featuredMovie}
          onPlay={() => handlePlay(featuredMovie)}
          onMoreInfo={() => setSelectedMovie(featuredMovie)}
        />
      )}

      {/* Search Results or Categories */}
      <div className="-mt-32 relative z-10">
        {searchQuery ? (
          // Search Results
          <div className="pt-40 px-4 md:px-12">
            <h2 className="text-white text-2xl font-bold mb-4">
              Resultados para "{searchQuery}"
            </h2>
            {filteredMovies.length > 0 ? (
              <CategoryRow
                title=""
                movies={filteredMovies}
                onPlay={handlePlay}
              />
            ) : (
              <p className="text-gray-400">No se encontraron resultados</p>
            )}
          </div>
        ) : (
          // Category Rows
          <>
            {/* Trending Now */}
            <CategoryRow
              title="Tendencias ahora"
              movies={DEMO_MOVIES.slice(0, 6)}
              onPlay={handlePlay}
            />

            {/* Top 10 */}
            <CategoryRow
              title="Top 10 en tu país"
              movies={DEMO_MOVIES.filter(m => m.rating > 8).slice(0, 10)}
              onPlay={handlePlay}
              isTop10
            />

            {/* Action */}
            <CategoryRow
              title="Películas de Acción"
              movies={getMoviesByCategory('accion')}
              onPlay={handlePlay}
            />

            {/* Drama */}
            <CategoryRow
              title="Dramas aclamados"
              movies={getMoviesByCategory('drama')}
              onPlay={handlePlay}
            />

            {/* Sci-Fi */}
            <CategoryRow
              title="Ciencia Ficción"
              movies={getMoviesByCategory('ciencia-ficcion')}
              onPlay={handlePlay}
            />

            {/* Terror */}
            <CategoryRow
              title="Terror y Suspense"
              movies={getMoviesByCategory('terror')}
              onPlay={handlePlay}
            />

            {/* Romance */}
            <CategoryRow
              title="Romance"
              movies={getMoviesByCategory('romance')}
              onPlay={handlePlay}
            />

            {/* Animation */}
            <CategoryRow
              title="Animación"
              movies={getMoviesByCategory('animacion')}
              onPlay={handlePlay}
            />

            {/* Documental */}
            <CategoryRow
              title="Documentales"
              movies={getMoviesByCategory('documental')}
              onPlay={handlePlay}
            />

            {/* Comedy */}
            <CategoryRow
              title="Comedia"
              movies={getMoviesByCategory('comedia')}
              onPlay={handlePlay}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <Footer />

      {/* Movie Detail Modal */}
      <MovieModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onPlay={handlePlay}
      />

      {/* Video Player */}
      {playingMovie && (
        <VideoPlayer
          movie={playingMovie}
          onClose={() => setPlayingMovie(null)}
        />
      )}
    </main>
  )
}
