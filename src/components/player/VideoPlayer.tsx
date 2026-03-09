'use client'

import { X } from 'lucide-react'
import type { Movie } from '@/types'

interface VideoPlayerProps {
  movie: Movie
  onClose: () => void
}

export default function VideoPlayer({ movie, onClose }: VideoPlayerProps) {
  // Convert YouTube URL to embed format if needed
  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/embed')) return url
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0]
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1`
    }
    if (url.includes('youtu.be')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1`
    }
    return url
  }

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-xl">{movie.title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Video */}
      <iframe
        src={getEmbedUrl(movie.videoUrl)}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
