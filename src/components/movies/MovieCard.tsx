'use client'

import { useState } from 'react'
import { Play, Plus, ThumbsUp, ChevronDown, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Movie } from '@/types'

interface MovieCardProps {
  movie: Movie
  onPlay?: (movie: Movie) => void
  onAddToList?: (movie: Movie) => void
  isLarge?: boolean
}

export default function MovieCard({ movie, onPlay, onAddToList, isLarge = false }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        'relative group cursor-pointer flex-shrink-0 transition-all duration-300',
        isLarge ? 'w-[300px] md:w-[350px]' : 'w-[180px] md:w-[220px]'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster */}
      <div className={cn(
        'relative overflow-hidden rounded-md transition-all duration-300',
        isLarge ? 'aspect-[16/9]' : 'aspect-[2/3]',
        isHovered && 'ring-2 ring-white shadow-2xl shadow-black/50'
      )}>
        <img
          src={movie.thumbnail}
          alt={movie.title}
          className={cn(
            'w-full h-full object-cover transition-transform duration-500',
            isHovered && 'scale-110'
          )}
        />

        {/* Gradient Overlay */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-300',
          isHovered ? 'opacity-100' : 'opacity-0'
        )} />

        {/* Hover Content */}
        <div className={cn(
          'absolute bottom-0 left-0 right-0 p-4 transition-all duration-300',
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}>
          {/* Title */}
          <h3 className="text-white font-bold text-sm md:text-base mb-2 line-clamp-1">
            {movie.title}
          </h3>

          {/* Actions */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPlay?.(movie)
              }}
              className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-white/90 transition"
            >
              <Play className="w-5 h-5 text-black fill-black" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToList?.(movie)
              }}
              className="w-9 h-9 rounded-full border-2 border-gray-400 flex items-center justify-center hover:border-white transition"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
            <button className="w-9 h-9 rounded-full border-2 border-gray-400 flex items-center justify-center hover:border-white transition">
              <ThumbsUp className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="text-green-500 font-semibold">98% coincidencia</span>
            <span className="border border-gray-500 px-1 text-[10px]">16+</span>
            <span>{movie.duration} min</span>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <span>{movie.category}</span>
          </div>
        </div>

        {/* Rating Badge */}
        {movie.rating > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded text-xs">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-white font-medium">{movie.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Title (when not hovered) */}
      <h3 className={cn(
        'text-gray-300 text-sm mt-2 transition-opacity duration-300 line-clamp-1',
        isHovered ? 'opacity-0' : 'opacity-100'
      )}>
        {movie.title}
      </h3>
    </div>
  )
}
