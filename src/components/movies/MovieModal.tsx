'use client'

import { useState } from 'react'
import { X, Play, Plus, ThumbsUp, Star } from 'lucide-react'
import type { Movie } from '@/types'

interface MovieModalProps {
  movie: Movie | null
  onClose: () => void
  onPlay: (movie: Movie) => void
}

export default function MovieModal({ movie, onClose, onPlay }: MovieModalProps) {
  if (!movie) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#181818] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative aspect-video">
          <img
            src={movie.thumbnail}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#181818] flex items-center justify-center hover:bg-gray-700 transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Action Buttons */}
          <div className="absolute bottom-4 left-6 flex items-center gap-3">
            <button
              onClick={() => onPlay(movie)}
              className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2 rounded hover:bg-white/90 transition"
            >
              <Play className="w-5 h-5 fill-black" />
              Reproducir
            </button>
            <button className="w-10 h-10 rounded-full border-2 border-gray-400 flex items-center justify-center hover:border-white transition">
              <Plus className="w-5 h-5 text-white" />
            </button>
            <button className="w-10 h-10 rounded-full border-2 border-gray-400 flex items-center justify-center hover:border-white transition">
              <ThumbsUp className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Meta Info */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-green-500 font-semibold">98% coincidencia</span>
            <span className="text-gray-400">{movie.year}</span>
            <span className="border border-gray-500 px-2 py-0.5 text-xs text-gray-300">16+</span>
            <span className="text-gray-400">{movie.duration} min</span>
            <span className="border border-gray-500 px-2 py-0.5 text-xs text-gray-300">HD</span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-white font-medium">{movie.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-300 text-base leading-relaxed mb-6">
            {movie.description}
          </p>

          {/* Additional Info */}
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-gray-500">Género: </span>
              <span className="text-white">{movie.category}</span>
            </p>
            <p>
              <span className="text-gray-500">Idioma: </span>
              <span className="text-white">{movie.language}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
