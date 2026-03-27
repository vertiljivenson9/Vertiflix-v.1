'use client'

/**
 * ═════════════════════════════════════════════════════════════════╗
 * ║           STREAM PLAYER - REGLAS ESTRICTAS                      ║
 * ║                                                                ║
 * ║   PROHIBIDO: links t.me, widgets, redirecciones               ║
 * ║   PERMITIDO: Solo /api/stream/:chatId/:videoId                ║
 * ║                                                                ║
 * ║   Flujo: StreamPlayer → /api/stream → MTProto → Telegram      ║
 * ╚════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, AlertCircle, RotateCcw, SkipBack, SkipForward, Wifi, WifiOff } from 'lucide-react'
import type { Movie } from '@/types'
import { getGoogleDriveEmbedUrl, detectVideoType } from '@/lib/video-utils'

interface StreamPlayerProps {
  movie: Movie
  onClose: () => void
}

export default function StreamPlayer({ movie, onClose }: StreamPlayerProps) {
  // Detectar tipo de video
  const videoType = useMemo(() => detectVideoType(movie.videoUrl || ''), [movie.videoUrl])
  const isGoogleDrive = videoType === 'google-drive'
  const isYouTube = videoType === 'youtube'
  const isTelegram = !!(movie.channelUsername && movie.channelMessageId)

  // ═════════════════════════════════════════════════════════════
  // CONSTRUIR URL DE STREAMING
  // ═════════════════════════════════════════════════════════════
  const streamUrl = useMemo(() => {
    // Google Drive embed
    if (isGoogleDrive && movie.videoUrl) {
      return getGoogleDriveEmbedUrl(movie.videoUrl)
    }

    // YouTube embed
    if (isYouTube && movie.videoUrl) {
      const url = movie.videoUrl
      let videoId = null
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0]
      } else if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0]
      } else if (url.includes('embed/')) {
        return url
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1`
      }
    }

    // ✅ TELEGRAM: SOLO endpoint correcto
    if (isTelegram && movie.channelUsername && movie.channelMessageId) {
      const chatId = movie.channelUsername.startsWith('@') 
        ? movie.channelUsername 
        : `@${movie.channelUsername}`
      return `/api/stream/${encodeURIComponent(chatId)}/${movie.channelMessageId}`
    }

    // URL directa (NO Telegram)
    if (movie.videoUrl && !movie.videoUrl.includes('t.me') && !movie.videoUrl.includes('telegram.org')) {
      return movie.videoUrl
    }

    return null
  }, [movie.channelUsername, movie.channelMessageId, movie.videoUrl, isTelegram, isGoogleDrive, isYouTube])

  // Video state
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
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
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good')

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hideTimer = useRef<NodeJS.Timeout>()
  const progressRef = useRef<HTMLDivElement>(null)

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      hideTimer.current = setTimeout(() => setShowControls(false), 4000)
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [showControls, isPlaying])

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Connection quality
  useEffect(() => {
    const connection = (navigator as any).connection
    if (connection) {
      const updateQuality = () => {
        if (connection.effectiveType === '4g') {
          setConnectionQuality('good')
        } else if (connection.effectiveType === '3g' || connection.effectiveType === '2g') {
          setConnectionQuality('poor')
        } else {
          setConnectionQuality('offline')
        }
      }
      updateQuality()
      connection.addEventListener('change', updateQuality)
      return () => connection.removeEventListener('change', updateQuality)
    }
  }, [])

  // Video event handlers
  const handleLoadStart = () => { setIsLoading(true); setError(null) }
  const handleCanPlay = () => { setIsLoading(false); setError(null) }
  const handlePlaying = () => { setIsPlaying(true); setVideoStarted(true); setIsLoading(false) }
  const handlePause = () => setIsPlaying(false)
  const handleWaiting = () => setIsLoading(true)
  const handleEnded = () => setIsPlaying(false)

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime
      const total = videoRef.current.duration
      setCurrentTime(current)
      setDuration(total)
      setProgress((current / total) * 100)

      if (videoRef.current.buffered.length > 0) {
        const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
        if (bufferedEnd - current < 5 && total - current > 10) {
          setConnectionQuality('poor')
        } else {
          setConnectionQuality('good')
        }
      }
    }
  }

  const handleProgress = () => {
    if (videoRef.current?.buffered.length) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
      const total = videoRef.current.duration
      setBuffered((bufferedEnd / total) * 100)
    }
  }

  const handleError = () => {
    setError('Error al cargar el video.')
    setIsLoading(false)
  }

  // Controls
  const formatTime = useCallback((seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  const handlePlay = useCallback(async () => {
    // Google Drive / YouTube - mostrar iframe
    if (isGoogleDrive || isYouTube) {
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
      } catch (err) {
        console.error('Play error:', err)
        setError('Error al reproducir')
      }
    }
  }, [isPlaying, isGoogleDrive, isYouTube])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const percent = ((e.clientX - rect.left) / rect.width) * 100
    const newTime = (percent / 100) * duration
    videoRef.current.currentTime = newTime
    setProgress(percent)
    setCurrentTime(newTime)
  }, [duration])

  const handleSeekRelative = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration))
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
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  const retryVideo = useCallback(() => {
    setError(null)
    setIsLoading(true)
    if (videoRef.current) {
      videoRef.current.load()
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          handlePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          handleSeekRelative(-10)
          break
        case 'ArrowRight':
          e.preventDefault()
          handleSeekRelative(10)
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
          e.preventDefault()
          setIsMuted(m => !m)
          break
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            onClose()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePlay, handleSeekRelative, onClose])

  // ═════════════════════════════════════════════════════════════
  // RENDER: SIN URL VÁLIDA
  // ═════════════════════════════════════════════════════════════
  if (!streamUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Video no disponible</h2>
          <p className="text-white/70 mb-4">Este video no tiene información de streaming válida.</p>
          <p className="text-gray-500 text-sm mb-4">
            Necesitas: channelUsername + channelMessageId
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/10 rounded-lg text-white hover:bg-white/20 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  // ═════════════════════════════════════════════════════════════
  // RENDER: MAIN PLAYER
  // ═════════════════════════════════════════════════════════════
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black select-none"
      onMouseMove={() => setShowControls(true)}
      onClick={() => setShowControls(true)}
    >
      {/* ═══════════ GOOGLE DRIVE IFRAME ═══════════ */}
      {isGoogleDrive && videoStarted && streamUrl && (
        <div className="w-full h-full">
          <iframe
            src={streamUrl}
            className="w-full h-full"
            style={{ border: 'none', background: 'black' }}
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
        </div>
      )}

      {/* ═══════════ YOUTUBE IFRAME ═══════════ */}
      {isYouTube && videoStarted && streamUrl && (
        <div className="w-full h-full">
          <iframe
            src={streamUrl}
            className="w-full h-full"
            style={{ border: 'none', background: 'black' }}
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
        </div>
      )}

      {/* ═══════════ VIDEO HTML5 (Telegram/Directos) ═══════════ */}
      {!isGoogleDrive && !isYouTube && (
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
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration)
            }
          }}
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
          <p className="text-white text-center text-lg mb-4">{error}</p>
          <button
            onClick={retryVideo}
            className="px-6 py-3 bg-[#E50914] rounded-lg text-white hover:bg-red-700 transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      )}

      {/* ═══════════ START SCREEN ═══════════ */}
      {!videoStarted && !error && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center scale-105 blur-sm opacity-30"
            style={{ backgroundImage: `url(${movie.thumbnail})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />

          <div className="relative z-10 text-center px-6 max-w-lg mx-auto h-full flex flex-col items-center justify-center">
            <button
              onClick={handlePlay}
              className="w-24 h-24 mb-6 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/50 hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-12 h-12 text-white ml-1" fill="white" />
            </button>

            <h2 className="text-white text-2xl md:text-3xl font-bold mb-2">{movie.title}</h2>
            <p className="text-gray-300 text-sm mb-1">
              {movie.year} • {movie.duration} min • ⭐ {movie.rating}
            </p>
            {movie.description && (
              <p className="text-gray-400 text-sm mb-6 line-clamp-2">{movie.description}</p>
            )}

            {isTelegram && (
              <div className="inline-flex items-center gap-2 bg-green-600/20 text-green-400 px-4 py-2 rounded-full text-sm mb-4">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                </svg>
                <span>MTProto Streaming</span>
              </div>
            )}

            {isGoogleDrive && (
              <div className="inline-flex items-center gap-2 bg-[#4285f4]/20 text-[#4285f4] px-4 py-2 rounded-full text-sm mb-4">
                <span>Google Drive</span>
              </div>
            )}

            {isYouTube && (
              <div className="inline-flex items-center gap-2 bg-red-600/20 text-red-500 px-4 py-2 rounded-full text-sm mb-4">
                <span>YouTube</span>
              </div>
            )}

            <p className="text-gray-500 text-xs">
              Presiona Play para reproducir • F para pantalla completa
            </p>
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition z-30"
          >
            <X className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ═══════════ CONTROLS (solo para video HTML5) ═══════════ */}
      {videoStarted && !error && !isGoogleDrive && !isYouTube && (
        <div
          className={`absolute inset-0 transition-opacity duration-300 z-10 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
            <div>
              <h3 className="text-white text-lg font-bold drop-shadow-lg">{movie.title}</h3>
              <p className="text-gray-300 text-xs drop-shadow">{movie.year} • {movie.category}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center play/pause */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={handlePlay}
              className="pointer-events-auto p-4 bg-black/30 rounded-full text-white hover:bg-black/50 transition transform hover:scale-110"
            >
              {isPlaying ? <Pause className="w-12 h-12" fill="white" /> : <Play className="w-12 h-12 ml-1" fill="white" />}
            </button>
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Progress bar */}
            <div
              ref={progressRef}
              className="h-1.5 bg-white/30 rounded-full cursor-pointer relative mb-3 group"
              onClick={handleSeek}
            >
              <div className="absolute h-full bg-white/50 rounded-full" style={{ width: `${buffered}%` }} />
              <div className="h-full bg-red-600 rounded-full relative transition-all" style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>

            {/* Time and buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={handlePlay} className="text-white hover:text-red-500 transition">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                <button onClick={() => handleSeekRelative(-10)} className="text-white hover:text-red-500 transition hidden sm:block" title="Retroceder 10s">
                  <SkipBack className="w-5 h-5" />
                </button>
                <button onClick={() => handleSeekRelative(10)} className="text-white hover:text-red-500 transition hidden sm:block" title="Adelantar 10s">
                  <SkipForward className="w-5 h-5" />
                </button>

                <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-red-500 transition">
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

      {/* Connection indicator */}
      {!error && connectionQuality !== 'good' && !isGoogleDrive && !isYouTube && (
        <div className="absolute top-16 right-4 z-30">
          {connectionQuality === 'poor' && (
            <span className="flex items-center gap-1 text-yellow-500 text-xs bg-black/50 px-2 py-1 rounded">
              <Wifi className="w-3 h-3" /> Conexión lenta
            </span>
          )}
          {connectionQuality === 'offline' && (
            <span className="flex items-center gap-1 text-red-500 text-xs bg-black/50 px-2 py-1 rounded">
              <WifiOff className="w-3 h-3" /> Sin conexión
            </span>
          )}
        </div>
      )}

      {/* Close button for iframe mode */}
      {(isGoogleDrive || isYouTube) && videoStarted && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition z-30"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
