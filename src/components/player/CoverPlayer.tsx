'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, AlertCircle, ExternalLink, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
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
  
  // Video URL state (para Telegram)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [urlSource, setUrlSource] = useState<string>('unknown')
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hideTimer = useRef<NodeJS.Timeout>()
  const progressRef = useRef<HTMLDivElement>(null)

  // Detect video type
  const isTelegram = movie.telegramLink?.includes('t.me') || movie.videoUrl?.includes('t.me') || movie.fileId
  const isGoogleDrive = movie.videoUrl?.includes('drive.google.com')
  const isYouTube = movie.videoUrl?.includes('youtube') || movie.videoUrl?.includes('youtu.be')
  const isDirectVideo = !isYouTube && !isGoogleDrive && !isTelegram && movie.videoUrl

  // ========== NUEVO SISTEMA: Obtener URL directa de Telegram ==========
  useEffect(() => {
    async function fetchVideoUrl() {
      if (isTelegram && movie.id) {
        setIsLoading(true)
        try {
          // Intentar obtener la URL directa del CDN de Telegram
          const params = new URLSearchParams()
          if (movie.fileId) {
            params.set('fileId', movie.fileId)
          } else if (movie.id) {
            params.set('movieId', movie.id)
          }
          
          const response = await fetch(`/api/video-url?${params}`)
          const data = await response.json()
          
          if (data.success && data.url) {
            setVideoUrl(data.url)
            setUrlSource(data.source || 'unknown')
            console.log('🎥 Video URL obtenida:', data.source, data.url?.substring(0, 50) + '...')
          } else {
            // Fallback al link de Telegram
            console.log('⚠️ Usando fallback de Telegram')
            setVideoUrl(movie.telegramLink || movie.videoUrl || null)
            setUrlSource('fallback')
          }
        } catch (err) {
          console.error('Error fetching video URL:', err)
          // Fallback
          setVideoUrl(movie.telegramLink || movie.videoUrl || null)
          setUrlSource('fallback')
        }
        setIsLoading(false)
      } else if (movie.videoUrl) {
        setVideoUrl(movie.videoUrl)
        setUrlSource('direct')
        setIsLoading(false)
      }
    }
    
    fetchVideoUrl()
  }, [isTelegram, movie.id, movie.fileId, movie.telegramLink, movie.videoUrl])

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      hideTimer.current = setTimeout(() => setShowControls(false), 4000)
    }
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [showControls, isPlaying])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // ========== VIDEO EVENT HANDLERS ==========
  const handleVideoLoadStart = () => {
    setIsLoading(true)
    setError(null)
  }

  const handleVideoCanPlay = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleVideoPlaying = () => {
    setIsPlaying(true)
    setVideoStarted(true)
    setIsLoading(false)
  }

  const handleVideoPause = () => {
    setIsPlaying(false)
  }

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime
      const total = videoRef.current.duration
      setCurrentTime(current)
      setDuration(total)
      setProgress((current / total) * 100)
    }
  }

  const handleVideoProgress = () => {
    if (videoRef.current?.buffered.length) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
      const total = videoRef.current.duration
      setBuffered((bufferedEnd / total) * 100)
    }
  }

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video error:', e)
    setError('No se pudo cargar el video. Puede que el enlace haya expirado.')
    setIsLoading(false)
  }

  const handleVideoWaiting = () => {
    setIsLoading(true)
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
  }

  // ========== CONTROLS ==========
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
    if (videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause()
        } else {
          await videoRef.current.play()
          setVideoStarted(true)
        }
      } catch (err) {
        console.error('Video play error:', err)
        setError('Error al reproducir. Intenta de nuevo.')
      }
    }
  }, [isPlaying])

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

  const openInTelegram = () => {
    const url = movie.telegramLink || movie.videoUrl
    if (url) {
      window.open(url, '_blank')
    }
  }

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

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black select-none"
      onMouseMove={() => setShowControls(true)}
      onClick={() => setShowControls(true)}
    >
      {/* ========== VIDEO PLAYER HTML5 ========== */}
      {videoUrl && !videoUrl.includes('t.me/') && (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full bg-black"
          playsInline
          preload="metadata"
          muted={isMuted}
          onLoadStart={handleVideoLoadStart}
          onCanPlay={handleVideoCanPlay}
          onPlaying={handleVideoPlaying}
          onPause={handleVideoPause}
          onTimeUpdate={handleVideoTimeUpdate}
          onProgress={handleVideoProgress}
          onError={handleVideoError}
          onWaiting={handleVideoWaiting}
          onEnded={handleVideoEnded}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration)
            }
          }}
        />
      )}

      {/* ========== FALLBACK: Telegram Embed para URLs t.me ========== */}
      {videoUrl && videoUrl.includes('t.me/') && videoStarted && (
        <div className="w-full h-full flex items-center justify-center">
          <iframe
            src={`${videoUrl}${videoUrl.includes('?') ? '&' : '?'}embed=1`}
            className="w-full h-full md:w-auto md:h-auto md:aspect-video md:max-h-full"
            style={{ border: 'none', background: 'black' }}
            allow="autoplay; fullscreen"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
        </div>
      )}

      {/* ========== LOADING OVERLAY ========== */}
      {isLoading && videoStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
      )}

      {/* ========== ERROR OVERLAY ========== */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <p className="text-white text-center px-4 mb-2">{error}</p>
          <p className="text-gray-400 text-sm mb-4">URL: {videoUrl?.substring(0, 50)}...</p>
          <div className="flex gap-3">
            <button 
              onClick={retryVideo}
              className="px-6 py-2 bg-[#E50914] rounded text-white hover:bg-red-700 transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reintentar
            </button>
            {isTelegram && (
              <button 
                onClick={openInTelegram}
                className="px-6 py-2 bg-[#0088cc] rounded text-white hover:bg-blue-700 transition flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Ver en Telegram
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========== START SCREEN ========== */}
      {!videoStarted && !error && (
        <>
          {/* Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center scale-105 blur-sm opacity-30"
            style={{ backgroundImage: `url(${movie.thumbnail})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
          
          {/* Content */}
          <div className="relative z-10 text-center px-6 max-w-lg mx-auto h-full flex flex-col items-center justify-center">
            <button 
              onClick={handlePlay}
              disabled={isLoading && !videoUrl}
              className="w-24 h-24 mb-6 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/50 hover:bg-red-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              ) : (
                <Play className="w-12 h-12 text-white ml-1" fill="white" />
              )}
            </button>
            
            <h2 className="text-white text-2xl md:text-3xl font-bold mb-2">{movie.title}</h2>
            <p className="text-gray-300 text-sm mb-1">
              {movie.year} • {movie.duration} min • ⭐ {movie.rating}
            </p>
            {movie.description && (
              <p className="text-gray-400 text-sm mb-6 line-clamp-2">{movie.description}</p>
            )}
            
            {isTelegram && (
              <div className="inline-flex items-center gap-2 bg-[#0088cc]/20 text-[#0088cc] px-4 py-2 rounded-full text-sm mb-4">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.099.154.232.17.324.015.093.034.306.019.472z"/>
                </svg>
                <span>{urlSource === 'telegram_cdn' ? 'Reproducción directa' : 'Ver en Telegram'}</span>
              </div>
            )}
            
            <p className="text-gray-500 text-xs">
              Espacio para reproducir • F para pantalla completa • M para silenciar
            </p>
          </div>
          
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition z-30"
          >
            <X className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ========== CONTROLS OVERLAY ========== */}
      {videoStarted && !error && (
        <div 
          className={`absolute inset-0 transition-opacity duration-300 z-10 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60" />
          
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
            <div>
              <h3 className="text-white text-lg font-bold drop-shadow-lg">{movie.title}</h3>
              <p className="text-gray-300 text-xs drop-shadow">
                {movie.year} • {movie.category}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Center controls (play/pause large) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button 
              onClick={handlePlay}
              className="pointer-events-auto p-4 bg-black/30 rounded-full text-white hover:bg-black/50 transition transform hover:scale-110"
            >
              {isPlaying ? (
                <Pause className="w-12 h-12" fill="white" />
              ) : (
                <Play className="w-12 h-12 ml-1" fill="white" />
              )}
            </button>
          </div>
          
          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Progress bar */}
            <div 
              ref={progressRef}
              className="h-1 bg-white/30 rounded-full cursor-pointer relative mb-3 group"
              onClick={handleSeek}
            >
              {/* Buffered */}
              <div 
                className="absolute h-full bg-white/50 rounded-full"
                style={{ width: `${buffered}%` }}
              />
              {/* Progress */}
              <div 
                className="h-full bg-red-600 rounded-full relative transition-all"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full border-2 border-white opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
            
            {/* Time and buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Play/Pause */}
                <button onClick={handlePlay} className="text-white hover:text-red-500 transition">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                
                {/* Skip buttons */}
                <button 
                  onClick={() => handleSeekRelative(-10)}
                  className="text-white hover:text-red-500 transition hidden sm:block"
                  title="Retroceder 10s"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleSeekRelative(10)}
                  className="text-white hover:text-red-500 transition hidden sm:block"
                  title="Adelantar 10s"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
                
                {/* Volume */}
                <button 
                  onClick={() => setIsMuted(!isMuted)} 
                  className="text-white hover:text-red-500 transition"
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
                
                {/* Time */}
                <span className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Telegram link */}
                {isTelegram && (
                  <button 
                    onClick={openInTelegram}
                    className="p-2 bg-[#0088cc] rounded-full text-white hover:bg-[#0077bb] transition"
                    title="Abrir en Telegram"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                
                {/* Fullscreen */}
                <button 
                  onClick={toggleFullscreen} 
                  className="text-white hover:text-red-500 transition"
                >
                  {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && videoStarted && (
        <div className="absolute bottom-20 left-4 text-white/40 text-xs z-30">
          <p>Source: {urlSource}</p>
          <p>URL: {videoUrl?.substring(0, 40)}...</p>
        </div>
      )}
    </div>
  )
}
