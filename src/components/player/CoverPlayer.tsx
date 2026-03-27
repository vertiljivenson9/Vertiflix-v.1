'use client'

/**
 * ╔════════════════════════════════════════════════════════════════╗
 * ║           REPRODUCTOR - REGLAS ESTRICTAS                       ║
 * ║                                                                ║
 * ║   PROHIBIDO: links t.me, widgets, embeds, redirecciones       ║
 * ║   PERMITIDO: Solo /api/stream/:chatId/:msgId                  ║
 * ╚════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, AlertCircle, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import type { Movie } from '@/types'

interface CoverPlayerProps {
  movie: Movie
  onClose: () => void
}

export default function CoverPlayer({ movie, onClose }: CoverPlayerProps) {
  // Video state
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  
  // UI state
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [videoStarted, setVideoStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hideTimer = useRef<NodeJS.Timeout>()
  const progressRef = useRef<HTMLDivElement>(null)

  // ═════════════════════════════════════════════════════════════
  // CONSTRUIR URL DE STREAMING
  // Formato: /api/stream/:chatId/:videoId (SOLO MTProto)
  // ═════════════════════════════════════════════════════════════
  const streamUrl = useMemo(() => {
    // ✅ TELEGRAM: SOLO MTProto
    if (movie.channelUsername && movie.channelMessageId) {
      const chatId = movie.channelUsername.startsWith('@') 
        ? movie.channelUsername 
        : `@${movie.channelUsername}`
      return `/api/stream/${encodeURIComponent(chatId)}/${movie.channelMessageId}`
    }
    
    // Google Drive
    if (movie.videoUrl?.includes('drive.google.com')) {
      const id = movie.videoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]
      if (id) return `https://drive.google.com/file/d/${id}/preview`
    }
    
    // URL directa (NO Telegram)
    if (movie.videoUrl && !movie.videoUrl.includes('t.me') && !movie.videoUrl.includes('telegram.org')) {
      return movie.videoUrl
    }
    
    return null
  }, [movie.channelUsername, movie.channelMessageId, movie.videoUrl])

  const isGoogleDrive = movie.videoUrl?.includes('drive.google.com')

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      hideTimer.current = setTimeout(() => setShowControls(false), 4000)
    }
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [showControls, isPlaying])

  // Fullscreen listener
  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFs)
    return () => document.removeEventListener('fullscreenchange', handleFs)
  }, [])

  // ═════════════════════════════════════════════════════════════
  // VIDEO EVENT HANDLERS
  // ═════════════════════════════════════════════════════════════
  const handleLoadStart = () => { setIsLoading(true); setError(null) }
  const handleCanPlay = () => { setIsLoading(false); setError(null) }
  const handlePlaying = () => { setIsPlaying(true); setVideoStarted(true); setIsLoading(false) }
  const handlePause = () => setIsPlaying(false)
  const handleWaiting = () => setIsLoading(true)
  const handleEnded = () => setIsPlaying(false)

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const c = videoRef.current.currentTime
      const d = videoRef.current.duration
      setCurrentTime(c)
      setDuration(d)
      setProgress((c / d) * 100)
    }
  }

  const handleProgress = () => {
    if (videoRef.current?.buffered.length) {
      const b = videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
      setBuffered((b / videoRef.current.duration) * 100)
    }
  }

  const handleError = () => {
    setError('Error al cargar el video. Intenta de nuevo.')
    setIsLoading(false)
  }

  // ═════════════════════════════════════════════════════════════
  // CONTROLS
  // ═════════════════════════════════════════════════════════════
  const formatTime = useCallback((s: number) => {
    if (!s || isNaN(s)) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}` : `${m}:${sec.toString().padStart(2,'0')}`
  }, [])

  const handlePlay = useCallback(async () => {
    if (isGoogleDrive && streamUrl?.includes('drive.google.com')) {
      setVideoStarted(true)
      setIsLoading(false)
      return
    }
    
    if (videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause()
        } else {
          await videoRef.current.play()
          setVideoStarted(true)
        }
      } catch {
        setError('Error al reproducir')
      }
    }
  }, [isPlaying, isGoogleDrive, streamUrl])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const pct = ((e.clientX - rect.left) / rect.width) * 100
    videoRef.current.currentTime = (pct / 100) * duration
    setProgress(pct)
    setCurrentTime((pct / 100) * duration)
  }, [duration])

  const handleSeekRelative = useCallback((s: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + s, duration))
    }
  }, [duration])

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {}
  }

  const retry = useCallback(() => {
    setError(null)
    setIsLoading(true)
    if (videoRef.current) videoRef.current.load()
  }, [])

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      switch (e.key) {
        case ' ': case 'k': e.preventDefault(); handlePlay(); break
        case 'ArrowLeft': e.preventDefault(); handleSeekRelative(-10); break
        case 'ArrowRight': e.preventDefault(); handleSeekRelative(10); break
        case 'f': e.preventDefault(); toggleFullscreen(); break
        case 'm': e.preventDefault(); setIsMuted(m => !m); break
        case 'Escape': document.fullscreenElement ? document.exitFullscreen() : onClose(); break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handlePlay, handleSeekRelative, onClose])

  // Sin URL válida
  if (!streamUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center p-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-white text-xl mb-2">Video no disponible</h2>
          <p className="text-gray-400 mb-4">Este video no tiene información de streaming.</p>
          <p className="text-gray-500 text-sm mb-4">
            Necesitas: channelUsername + channelMessageId
          </p>
          <button onClick={onClose} className="px-6 py-2 bg-white/10 rounded text-white">
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black select-none"
      onMouseMove={() => setShowControls(true)}
    >
      {/* ═══════════ VIDEO HTML5 ═══════════ */}
      {!isGoogleDrive && (
        <video
          ref={videoRef}
          src={streamUrl}
          className="w-full h-full bg-black"
          playsInline
          preload="metadata"
          muted={isMuted}
          onLoadStart={handleLoadStart}
          onCanPlay={handleCanPlay}
          onPlaying={handlePlaying}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onProgress={handleProgress}
          onError={handleError}
          onWaiting={handleWaiting}
          onEnded={handleEnded}
          onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
        />
      )}

      {/* ═══════════ GOOGLE DRIVE ═══════════ */}
      {isGoogleDrive && videoStarted && (
        <iframe
          src={streamUrl}
          className="w-full h-full"
          style={{ border: 'none', background: 'black' }}
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      )}

      {/* ═══════════ LOADING ═══════════ */}
      {isLoading && videoStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* ═══════════ ERROR ═══════════ */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 p-4">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <p className="text-white text-center mb-4">{error}</p>
          <button onClick={retry} className="px-6 py-2 bg-[#E50914] rounded text-white hover:bg-red-700 transition flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Reintentar
          </button>
        </div>
      )}

      {/* ═══════════ START SCREEN ═══════════ */}
      {!videoStarted && !error && (
        <>
          <div className="absolute inset-0 bg-cover bg-center scale-105 blur-sm opacity-30" style={{ backgroundImage: `url(${movie.thumbnail})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
          
          <div className="relative z-10 text-center px-6 max-w-lg mx-auto h-full flex flex-col items-center justify-center">
            <button 
              onClick={handlePlay}
              disabled={isLoading}
              className="w-24 h-24 mb-6 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/50 hover:bg-red-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-10 h-10 text-white animate-spin" /> : <Play className="w-12 h-12 text-white ml-1" fill="white" />}
            </button>
            
            <h2 className="text-white text-2xl md:text-3xl font-bold mb-2">{movie.title}</h2>
            <p className="text-gray-300 text-sm mb-1">{movie.year} • {movie.duration} min • ⭐ {movie.rating}</p>
            {movie.description && <p className="text-gray-400 text-sm mb-6 line-clamp-2">{movie.description}</p>}
            
            {movie.channelUsername && movie.channelMessageId && (
              <div className="inline-flex items-center gap-2 bg-green-600/20 text-green-400 px-4 py-2 rounded-full text-sm mb-4">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                <span>MTProto Streaming</span>
              </div>
            )}
            
            <p className="text-gray-500 text-xs">Espacio para reproducir • F pantalla completa</p>
          </div>
          
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition z-30">
            <X className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ═══════════ CONTROLS ═══════════ */}
      {videoStarted && !error && !isGoogleDrive && (
        <div className={`absolute inset-0 transition-opacity duration-300 z-10 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />
          
          {/* Top */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
            <div>
              <h3 className="text-white text-lg font-bold drop-shadow-lg">{movie.title}</h3>
              <p className="text-gray-300 text-xs drop-shadow">{movie.year} • {movie.category}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button onClick={handlePlay} className="pointer-events-auto p-4 bg-black/30 rounded-full text-white hover:bg-black/50 transition transform hover:scale-110">
              {isPlaying ? <Pause className="w-12 h-12" fill="white" /> : <Play className="w-12 h-12 ml-1" fill="white" />}
            </button>
          </div>
          
          {/* Bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Progress */}
            <div ref={progressRef} className="h-1 bg-white/30 rounded-full cursor-pointer relative mb-3 group" onClick={handleSeek}>
              <div className="absolute h-full bg-white/50 rounded-full" style={{ width: `${buffered}%` }} />
              <div className="h-full bg-red-600 rounded-full relative" style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={handlePlay} className="text-white hover:text-red-500 transition">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                <button onClick={() => handleSeekRelative(-10)} className="text-white hover:text-red-500 transition hidden sm:block"><SkipBack className="w-5 h-5" /></button>
                <button onClick={() => handleSeekRelative(10)} className="text-white hover:text-red-500 transition hidden sm:block"><SkipForward className="w-5 h-5" /></button>
                <button onClick={() => setIsMuted(m => !m)} className="text-white hover:text-red-500 transition">
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
                <span className="text-white text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>
              </div>
              
              <button onClick={toggleFullscreen} className="text-white hover:text-red-500 transition">
                {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
