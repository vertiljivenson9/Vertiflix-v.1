'use client'

import { Play, Info, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import type { Movie } from '@/types'

interface MovieHeroProps {
  movie: Movie
  onPlay?: () => void
  onMoreInfo?: () => void
}

export default function MovieHero({ movie, onPlay, onMoreInfo }: MovieHeroProps) {
  const [muted, setMuted] = useState(true)

  return (
    <section className="relative h-[85vh] md:h-[90vh] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={movie.thumbnail}
          alt={movie.title}
          className="w-full h-full object-cover scale-105"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center px-4 md:px-12 lg:px-20 max-w-3xl">
        {/* Title */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 drop-shadow-lg">
          {movie.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-4 text-sm md:text-base">
          <span className="text-green-500 font-bold">98% coincidencia</span>
          <span className="text-gray-400">{movie.year}</span>
          <span className="border border-gray-500 px-2 py-0.5 text-xs text-gray-300">16+</span>
          <span className="text-gray-400">{movie.duration} min</span>
          <span className="border border-gray-500 px-2 py-0.5 text-xs text-gray-300">HD</span>
        </div>

        {/* Description */}
        <p className="text-gray-200 text-base md:text-lg mb-6 line-clamp-3 md:line-clamp-4 max-w-2xl">
          {movie.description}
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <Button
            onClick={onPlay}
            className="bg-white hover:bg-white/90 text-black font-bold px-8 py-6 text-lg gap-2"
          >
            <Play className="w-6 h-6 fill-black" />
            Reproducir
          </Button>
          <Button
            onClick={onMoreInfo}
            variant="secondary"
            className="bg-gray-500/70 hover:bg-gray-500/50 text-white font-bold px-8 py-6 text-lg gap-2"
          >
            <Info className="w-6 h-6" />
            Más información
          </Button>
        </div>
      </div>

      {/* Mute Button */}
      <button
        onClick={() => setMuted(!muted)}
        className="absolute bottom-32 right-12 w-12 h-12 rounded-full border border-white/50 flex items-center justify-center hover:bg-white/20 transition"
      >
        {muted ? (
          <VolumeX className="w-6 h-6 text-white" />
        ) : (
          <Volume2 className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Age Rating */}
      <div className="absolute bottom-32 right-28 bg-gray-800/80 border-l-2 border-white px-4 py-1">
        <span className="text-white text-sm">16+</span>
      </div>
    </section>
  )
}
