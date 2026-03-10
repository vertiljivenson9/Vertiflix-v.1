'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Subtitles, Languages, ChevronDown, Maximize, Minimize, Loader2, AlertCircle, ExternalLink, RotateCcw } from 'lucide-react'
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
  const [isLoading, setIsLoading] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  // Estado para transición a Telegram
  const [showTelegramTransition, setShowTelegramTransition] = useState(false)
  const [transitionProgress, setTransitionProgress] = useState(0)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hideTimer = useRef<NodeJS.Timeout>()

  // Detect video type
  const isTelegram = movie.id?.startsWith('tg_') || movie.videoUrl?.includes('telegram') || movie.videoUrl?.includes('t.me')
  const isGoogleDrive = movie.videoUrl?.includes('drive.google.com')
  const isYouTube = movie.videoUrl?.includes('youtube') || movie.videoUrl?.includes('youtu.be')
  const isDirectVideo = !isYouTube && !isGoogleDrive && !isTelegram && movie.videoUrl

  // Detect orientation
  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    return () => window.removeEventListener('resize', checkOrientation)
  }, [])

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      hideTimer.current = setTimeout(() => setShowControls(false), 4000)
    }
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [showControls, isPlaying])

  // Video event handlers
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

  // Abrir en Telegram con transición
  const openInTelegram = useCallback(() => {
    setShowTelegramTransition(true)
    
    // Animación de progreso
    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      setTransitionProgress(progress)
      
      if (progress >= 100) {
        clearInterval(interval)
        
        // Abrir Telegram
        const telegramUrl = movie.telegramLink || `https://t.me/VertiflixBot`
        
        // Intentar abrir la app de Telegram primero
        const deepLink = `tg://resolve?domain=VertiflixBot`
        
        // Crear un iframe oculto para intentar abrir la app
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.src = deepLink
        document.body.appendChild(iframe)
        
        // Después de un pequeño delay, abrir el enlace web
        setTimeout(() => {
          window.open(telegramUrl, '_blank')
          document.body.removeChild(iframe)
          setShowTelegramTransition(false)
          setTransitionProgress(0)
        }, 500)
      }
    }, 50)
  }, [movie.telegramLink])

  // Play video - Para Telegram abre la transición
  const handlePlay = useCallback(async () => {
    // Para videos de Telegram, mostrar transición
    if (isTelegram) {
      openInTelegram()
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
  }, [isPlaying, videoStarted, isTelegram, openInTelegram])

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
  const getEmbedUrl = () => {
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
    if (!showSubtitles || !isPlaying || !duration) return ''
    const sceneIndex = Math.floor(progress / 3) * 3
    return SCENE_SUBTITLES[subtitleLang][sceneIndex] || ''
  }, [progress, subtitleLang, showSubtitles, isPlaying, duration])

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black" onMouseMove={() => setShowControls(true)}>
      
      {/* CAPA DE TRANSICIÓN A TELEGRAM */}
      {showTelegramTransition && (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          {/* Fondo con blur del thumbnail */}
          <div 
            className="absolute inset-0 bg-cover bg-center scale-110 blur-xl opacity-30"
            style={{ backgroundImage: `url(${movie.thumbnail})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black" />
          
          {/* Contenido de transición */}
          <div className="relative z-10 text-center px-8 max-w-md">
            {/* Logo animado de Telegram */}
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-[#0088cc] rounded-full animate-ping opacity-25" />
              <div className="relative w-24 h-24 bg-[#0088cc] rounded-full flex items-center justify-center">
                <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.099.154.232.17.324.015.093.034.306.019.472z"/>
                </svg>
              </div>
            </div>
            
            {/* Texto */}
            <h2 className="text-white text-xl font-bold mb-2">{movie.title}</h2>
            <p className="text-white/60 text-sm mb-6">Conectando con Telegram...</p>
            
            {/* Barra de progreso */}
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-[#0088cc] transition-all duration-100"
                style={{ width: `${transitionProgress}%` }}
              />
            </div>
            
            {/* Info */}
            <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
              <ExternalLink className="w-3 h-3" />
              <span>El video se abrirá en Telegram</span>
            </div>
          </div>
        </div>
      )}
      
      {/* LANDSCAPE MODE */}
      {orientation === 'landscape' && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div 
            className="relative bg-black overflow-hidden rounded-lg"
            style={{ 
              width: '90vw',
              height: 'calc(90vw * 9 / 16)',
              maxHeight: '85vh',
              maxWidth: 'calc(85vh * 16 / 9)'
            }}
          >
            {/* Thumbnail (shows before video starts) */}
            {!videoStarted && !isPlaying && (
              <img 
                src={movie.thumbnail} 
                alt={movie.title} 
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Telegram Video - Show special overlay */}
            {isTelegram && !videoStarted && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                <div className="w-16 h-16 rounded-full bg-[#0088cc] flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.099.154.232.17.324.015.093.034.306.019.472z"/>
                  </svg>
                </div>
                <p className="text-white/80 text-sm text-center px-4">
                  El video se reproducirá en Telegram
                </p>
              </div>
            )}

            {/* Direct Video - HTML5 Player */}
            {!isTelegram && (isDirectVideo || isGoogleDrive) && (
              <video
                ref={videoRef}
                src={isGoogleDrive ? undefined : movie.videoUrl}
                className={`w-full h-full bg-black ${videoStarted ? 'opacity-100' : 'opacity-0'}`}
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
                src={getEmbedUrl()} 
                className="w-full h-full" 
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            )}
            
            {/* Loading overlay */}
            {isLoading && !isTelegram && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
            )}

            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
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
            
            {/* Buffering indicator */}
            {!isTelegram && (isDirectVideo) && buffered < 100 && videoStarted && (
              <div className="absolute bottom-16 left-0 right-0 px-4">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500/50 transition-all"
                    style={{ width: `${buffered}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Subtítulos */}
            {showSubtitles && isPlaying && displayedSubtitle && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4 pointer-events-none">
                <span className="bg-black/90 text-white px-4 py-2 rounded text-base font-medium max-w-[90%] text-center">
                  {displayedSubtitle}
                </span>
              </div>
            )}
          </div>
          
          {/* Controles */}
          <div className={`absolute inset-0 transition-opacity ${showControls || !videoStarted ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
            
            {/* Top */}
            <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-start">
              <div>
                <h3 className="text-white text-lg font-bold">{movie.title}</h3>
                <p className="text-gray-300 text-xs">{movie.year} • {movie.category}</p>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded text-white text-sm">
                    <Languages className="w-4 h-4" /> {LANG_NAMES[subtitleLang]} <ChevronDown className="w-3 h-3" />
                  </button>
                  {showLangMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-gray-900 rounded-lg overflow-hidden min-w-[120px]">
                      {(['es', 'en', 'fr'] as SubtitleLang[]).map(l => (
                        <button key={l} onClick={() => { setSubtitleLang(l); setShowLangMenu(false) }} className={`block w-full px-3 py-2 text-left text-sm ${subtitleLang === l ? 'text-red-500' : 'text-white'} hover:bg-gray-800`}>
                          {LANG_NAMES[l]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setShowSubtitles(!showSubtitles)} className={`p-2 rounded ${showSubtitles ? 'bg-red-600' : 'bg-white/10'} text-white`}>
                  <Subtitles className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="p-2 bg-white/10 rounded text-white"><X className="w-4 h-4" /></button>
              </div>
            </div>
            
            {/* Center Play Button */}
            {!videoStarted && !isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button 
                  onClick={handlePlay} 
                  disabled={isLoading}
                  className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : isTelegram ? (
                    <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.099.154.232.17.324.015.093.034.306.019.472z"/>
                    </svg>
                  ) : (
                    <Play className="w-10 h-10 text-white ml-1" fill="white" />
                  )}
                </button>
              </div>
            )}
            
            {/* Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              {/* Progress bar */}
              {!isTelegram && (
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-white text-xs min-w-[40px]">{formatTime(currentTime)}</span>
                  <div 
                    className="flex-1 h-1 bg-white/30 rounded-full cursor-pointer relative"
                    onClick={handleSeek}
                  >
                    {/* Buffered */}
                    {isDirectVideo && (
                      <div 
                        className="absolute h-full bg-blue-500/30 rounded-full"
                        style={{ width: `${buffered}%` }}
                      />
                    )}
                    {/* Progress */}
                    <div className="h-full bg-red-600 rounded-full relative" style={{ width: `${progress}%` }}>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full border-2 border-white" />
                    </div>
                  </div>
                  <span className="text-white text-xs min-w-[40px]">{formatTotalTime()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <div className="flex gap-3">
                  <button onClick={handlePlay} className="text-white">
                    {isTelegram ? (
                      <ExternalLink className="w-5 h-5" />
                    ) : isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </button>
                  {!isTelegram && (
                    <button onClick={() => setIsMuted(!isMuted)} className="text-white">
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                  )}
                </div>
                <button onClick={toggleFullscreen} className="text-white">
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* PORTRAIT MODE */}
      {orientation === 'portrait' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${movie.thumbnail})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/80" />
          
          <div className="relative z-10 text-center px-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/50 animate-pulse">
              <Play className="w-10 h-10 text-white ml-1" fill="white" />
            </div>
            <h2 className="text-white text-xl font-bold mb-2">{movie.title}</h2>
            <p className="text-gray-300 text-sm mb-1">{movie.year} • {movie.duration} min • ⭐ {movie.rating}</p>
            <p className="text-gray-400 text-xs mb-5 line-clamp-2">{movie.description}</p>
            
            {isTelegram && (
              <div className="flex items-center justify-center gap-2 text-[#0088cc] text-sm mb-4">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.099.154.232.17.324.015.093.034.306.019.472z"/>
                </svg>
                <span>Disponible en Telegram</span>
              </div>
            )}
            
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M12 18h.01" />
              </svg>
              <span>Rota para ver</span>
            </div>
            
            <button onClick={onClose} className="mt-5 px-4 py-2 bg-white/10 rounded-full text-white text-sm hover:bg-white/20">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
