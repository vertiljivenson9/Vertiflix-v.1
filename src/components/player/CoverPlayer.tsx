'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, AlertCircle, ExternalLink, ChevronLeft, RotateCcw } from 'lucide-react'
import type { Movie } from '@/types'

interface CoverPlayerProps {
  movie: Movie
  onClose: () => void
}

type SubtitleLang = 'es' | 'en' | 'fr'

const LANG_NAMES: Record<SubtitleLang, string> = { es: 'Español', en: 'English', fr: 'Français' }

const SCENE_SUBTITLES: Record<SubtitleLang, Record<number, string>> = {
  es: {
    0: 'La historia comienza...',
    3: '¿Quién está ahí?',
    6: 'No tengas miedo.',
    9: 'Estoy aquí para ayudarte.',
    12: 'Debemos irnos ahora.',
    15: 'El camino será peligroso.',
    18: '¡Mira! Allí está la salida.',
    21: 'No puedo creerlo.',
    24: 'Esto cambiará todo.',
    27: 'Tenemos que ser fuertes.',
    30: 'El destino nos ha unido.',
    33: '¿Recuerdas cuando comenzó?',
    36: 'Parece que fue ayer.',
    39: 'No me arrepiento de nada.',
    42: 'Cada momento valió la pena.',
    45: 'Lo logramos.',
    48: 'Esto es solo el comienzo.',
    51: 'El futuro nos espera.',
    54: 'Estoy listo.',
    57: 'Nuestra historia continúa...'
  },
  en: {
    0: 'The story begins...',
    3: 'Who is there?',
    6: "Don't be afraid.",
    9: "I'm here to help you.",
    12: 'We must leave now.',
    15: 'The path will be dangerous.',
    18: 'Look! There is the exit.',
    21: "I can't believe it.",
    24: 'This will change everything.',
    27: 'We must be strong.',
    30: 'Destiny has united us.',
    33: 'Do you remember when it started?',
    36: 'It seems like yesterday.',
    39: "I don't regret anything.",
    42: 'Every moment was worth it.',
    45: 'We made it.',
    48: 'This is just the beginning.',
    51: 'The future awaits us.',
    54: "I'm ready.",
    57: 'Our story continues...'
  },
  fr: {
    0: "L'histoire commence...",
    3: 'Qui est là?',
    6: "N'aie pas peur.",
    9: 'Je suis là pour taider.',
    12: 'Nous devons partir.',
    15: 'Le chemin sera dangereux.',
    18: 'Regarde! La sortie est là.',
    21: "Je n'y crois pas.",
    24: 'Cela va tout changer.',
    27: 'Nous devons être forts.',
    30: 'Le destin nous a unis.',
    33: 'Te souviens-tu quand ça a commencé?',
    36: 'On dirait hier.',
    39: 'Je ne regrette rien.',
    42: 'Chaque instant en valait la peine.',
    45: 'Nous y sommes arrivés.',
    48: "Ce n'est que le début.",
    51: "L'avenir nous attend.",
    54: 'Je suis prêt.',
    57: 'Notre histoire continue...'
  }
}

export default function CoverPlayer({ movie, onClose }: CoverPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [subtitleLang, setSubtitleLang] = useState<SubtitleLang>('es')
  const [showSubtitles, setShowSubtitles] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [videoStarted, setVideoStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [buffered, setBuffered] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hideTimer = useRef<NodeJS.Timeout>()

  // Detect video type
  const isTelegram = movie.id?.startsWith('tg_') || movie.telegramLink?.includes('t.me')
  const isGoogleDrive = movie.videoUrl?.includes('drive.google.com')
  const isYouTube = movie.videoUrl?.includes('youtube') || movie.videoUrl?.includes('youtu.be')
  const isDirectVideo = !isYouTube && !isGoogleDrive && !isTelegram && movie.videoUrl

  // ========== LA MAGIA DEL EMBED ==========
  // Convertir link de Telegram a formato embed
  const getTelegramEmbedUrl = useCallback(() => {
    if (!movie.telegramLink && !movie.videoUrl) return null
    
    const url = movie.telegramLink || movie.videoUrl || ''
    
    // Si ya tiene embed=1, usarlo tal cual
    if (url.includes('embed=1')) return url
    
    // Formato: https://t.me/canal/messageId -> https://t.me/canal/messageId?embed=1
    // O: https://t.me/c/123456/789 -> https://t.me/c/123456/789?embed=1
    
    if (url.includes('t.me/')) {
      return `${url}${url.includes('?') ? '&' : '?'}embed=1`
    }
    
    return null
  }, [movie.telegramLink, movie.videoUrl])

  const telegramEmbedUrl = isTelegram ? getTelegramEmbedUrl() : null

  // Detect orientation
  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', () => setTimeout(checkOrientation, 50))
    return () => {
      window.removeEventListener('resize', checkOrientation)
    }
  }, [])

  // Auto-hide controls (solo para videos nativos, no Telegram embed)
  useEffect(() => {
    if (showControls && isPlaying && !isTelegram) {
      hideTimer.current = setTimeout(() => setShowControls(false), 4000)
    }
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [showControls, isPlaying, isTelegram])

  // Video event handlers (para videos nativos)
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

  const handleVideoError = () => {
    setError('No se pudo cargar el video. Intenta de nuevo.')
    setIsLoading(false)
  }

  const handleVideoWaiting = () => {
    setIsLoading(true)
  }

  // Format time
  const formatTime = useCallback((seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  const formatTotalTime = useCallback(() => {
    if (duration && !isNaN(duration)) {
      return formatTime(duration)
    }
    return movie.duration ? `${movie.duration}:00` : '0:00'
  }, [duration, movie.duration, formatTime])

  // Play video
  const handlePlay = useCallback(async () => {
    // Para Telegram, el iframe se carga automáticamente
    if (isTelegram) {
      setVideoStarted(true)
      setIsPlaying(true)
      setIsLoading(false)
      return
    }

    // For HTML5 video
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
      return
    }

    // For YouTube iframe
    if (iframeRef.current) {
      if (!videoStarted) {
        iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
        setVideoStarted(true)
      } else {
        if (isPlaying) {
          iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
        } else {
          iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
        }
      }
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying, videoStarted, isTelegram])

  // Seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = ((e.clientX - rect.left) / rect.width) * 100
    const newTime = (percent / 100) * (duration || movie.duration * 60)
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
    setProgress(percent)
    setCurrentTime(newTime)
  }

  // Fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    if (!isFullscreen) {
      await containerRef.current.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  // YouTube embed URL
  const getYouTubeEmbedUrl = () => {
    const url = movie.videoUrl || ''
    const autoplay = videoStarted ? 1 : 0
    if (url.includes('youtube.com/watch')) {
      return `https://www.youtube.com/embed/${url.split('v=')[1]?.split('&')[0]}?autoplay=${autoplay}&controls=1&modestbranding=1&rel=0&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`
    }
    if (url.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${url.split('youtu.be/')[1]}?autoplay=${autoplay}&controls=1&modestbranding=1&rel=0&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`
    }
    if (url.includes('youtube.com/embed')) {
      return `${url}?autoplay=${autoplay}&controls=1&modestbranding=1&rel=0&enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`
    }
    return url
  }

  // Subtitles
  const displayedSubtitle = useMemo(() => {
    if (!showSubtitles || !isPlaying || !duration || isTelegram) return ''
    const sceneIndex = Math.floor(progress / 3) * 3
    return SCENE_SUBTITLES[subtitleLang][sceneIndex] || ''
  }, [progress, subtitleLang, showSubtitles, isPlaying, duration, isTelegram])

  // Abrir en Telegram como fallback
  const openInTelegram = () => {
    const url = movie.telegramLink || movie.videoUrl
    if (url) {
      window.open(url, '_blank')
    }
  }

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-50 bg-black flex justify-center items-center"
      style={{ backgroundColor: 'black' }}
      onMouseMove={() => !isTelegram && setShowControls(true)}
    >
      
      {/* ========== MODO CINE - TELEGRAM EMBED ========== */}
      {isTelegram && telegramEmbedUrl && videoStarted && (
        <div 
          className="w-full h-full flex justify-center items-center"
          style={{ 
            width: orientation === 'portrait' ? '100%' : '100%',
            height: '100%'
          }}
        >
          {/* IFRAME MÁGICO DE TELEGRAM */}
          <iframe
            ref={iframeRef}
            src={telegramEmbedUrl}
            className="w-full h-full"
            style={{ 
              aspectRatio: orientation === 'landscape' ? '16/9' : '9/16',
              border: 'none',
              background: 'black'
            }}
            allow="autoplay; fullscreen"
            allowFullScreen
            loading="lazy"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      )}

      {/* ========== PANTALLA INICIAL - ANTES DE PLAY ========== */}
      {!videoStarted && (
        <>
          {/* Thumbnail de fondo */}
          <div 
            className="absolute inset-0 bg-cover bg-center scale-105 blur-sm opacity-40"
            style={{ backgroundImage: `url(${movie.thumbnail})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
          
          {/* Contenido centrado */}
          <div className="relative z-10 text-center px-6 max-w-lg">
            {/* Botón Play grande */}
            <button 
              onClick={handlePlay}
              className="w-24 h-24 mx-auto mb-6 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/50 hover:bg-red-700 transition-all hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              ) : isTelegram ? (
                <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.099.154.232.17.324.015.093.034.306.019.472z"/>
                </svg>
              ) : (
                <Play className="w-12 h-12 text-white ml-1" fill="white" />
              )}
            </button>
            
            <h2 className="text-white text-2xl font-bold mb-2">{movie.title}</h2>
            <p className="text-gray-300 text-sm mb-1">{movie.year} • {movie.duration} min • ⭐ {movie.rating}</p>
            <p className="text-gray-400 text-sm mb-6 line-clamp-2">{movie.description}</p>
            
            {isTelegram && (
              <div className="inline-flex items-center gap-2 bg-[#0088cc]/20 text-[#0088cc] px-4 py-2 rounded-full text-sm mb-6">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.099.154.232.17.324.015.093.034.306.019.472z"/>
                </svg>
                <span>Ver en Telegram</span>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M12 18h.01" />
              </svg>
              <span>Gira el teléfono para ver</span>
            </div>
          </div>
          
          {/* Botón cerrar */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </>
      )}

      {/* ========== CONTROLES PARA VIDEO NO-TELEGRAM ========== */}
      {!isTelegram && videoStarted && (
        <>
          {/* Google Drive / Direct Video - HTML5 Player */}
          {(isDirectVideo || isGoogleDrive) && (
            <video
              ref={videoRef}
              src={isGoogleDrive ? undefined : movie.videoUrl}
              className={`w-full h-full bg-black`}
              playsInline
              preload="metadata"
              onLoadStart={handleVideoLoadStart}
              onCanPlay={handleVideoCanPlay}
              onPlaying={handleVideoPlaying}
              onPause={handleVideoPause}
              onTimeUpdate={handleVideoTimeUpdate}
              onProgress={handleVideoProgress}
              onError={handleVideoError}
              onWaiting={handleVideoWaiting}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration)
                }
              }}
            />
          )}

          {/* YouTube Embed */}
          {isYouTube && (
            <iframe 
              ref={iframeRef}
              src={getYouTubeEmbedUrl()} 
              className="w-full h-full" 
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          )}
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-white text-center px-4">{error}</p>
              <button 
                onClick={() => {
                  setError(null)
                  if (videoRef.current) {
                    videoRef.current.load()
                  }
                }}
                className="mt-4 px-4 py-2 bg-[#E50914] rounded text-white text-sm"
              >
                Reintentar
              </button>
            </div>
          )}
          
          {/* Controles */}
          <div className={`absolute inset-0 transition-opacity z-10 ${showControls || !videoStarted ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
            
            {/* Top */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
              <div>
                <h3 className="text-white text-lg font-bold">{movie.title}</h3>
                <p className="text-gray-300 text-xs">{movie.year} • {movie.category}</p>
              </div>
              <button onClick={onClose} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-white text-xs min-w-[40px]">{formatTime(currentTime)}</span>
                <div 
                  className="flex-1 h-1 bg-white/30 rounded-full cursor-pointer relative"
                  onClick={handleSeek}
                >
                  <div className="h-full bg-red-600 rounded-full relative" style={{ width: `${progress}%` }}>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full border-2 border-white" />
                  </div>
                </div>
                <span className="text-white text-xs min-w-[40px]">{formatTotalTime()}</span>
              </div>
              <div className="flex justify-between">
                <div className="flex gap-4">
                  <button onClick={handlePlay} className="text-white">
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                  <button onClick={() => setIsMuted(!isMuted)} className="text-white">
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </button>
                </div>
                <button onClick={toggleFullscreen} className="text-white">
                  {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========== CONTROLES TELEGRAM (SOLO CERRAR) ========== */}
      {isTelegram && videoStarted && (
        <div className="absolute top-4 right-4 z-30 flex gap-2">
          {/* Botón abrir en Telegram */}
          <button 
            onClick={openInTelegram}
            className="p-2 bg-[#0088cc] rounded-full text-white hover:bg-[#0077bb] transition"
            title="Abrir en Telegram"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
          {/* Botón cerrar */}
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ========== INDICADOR MODO CINE ========== */}
      {isTelegram && videoStarted && (
        <div className="absolute bottom-4 right-4 text-white/20 text-xs pointer-events-none z-30">
          🎬 Modo Cine
        </div>
      )}
    </div>
  )
}
