'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from './MovieCard'
import type { Movie } from '@/types'

interface CategoryRowProps {
  title: string
  movies: Movie[]
  onPlay?: (movie: Movie) => void
  isTop10?: boolean
}

export default function CategoryRow({ title, movies, onPlay, isTop10 = false }: CategoryRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.8
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="relative group/category py-4">
      {/* Title */}
      <h2 className="text-xl md:text-2xl font-bold text-white mb-2 px-4 md:px-12 flex items-center gap-2">
        {title}
        {isTop10 && (
          <span className="text-red-600 text-sm font-normal">TOP 10</span>
        )}
      </h2>

      {/* Row Container */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-black/50 opacity-0 group-hover/category:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/70"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>

        {/* Movies Row */}
        <div
          ref={rowRef}
          className="flex gap-2 overflow-x-scroll scrollbar-hide px-4 md:px-12 pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie, index) => (
            <div key={movie.id} className="flex items-center">
              {isTop10 && (
                <span className="text-8xl font-black text-gray-800 stroke-text mr-[-20px] z-0">
                  {index + 1}
                </span>
              )}
              <MovieCard
                movie={movie}
                onPlay={onPlay}
                isLarge={isTop10 && index < 3}
              />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-black/50 opacity-0 group-hover/category:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/70"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      </div>
    </div>
  )
}
