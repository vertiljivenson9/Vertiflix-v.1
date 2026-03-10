'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Subtitles, Languages, ChevronDown, Maximize, Minimize, Zap, Star, Film, Ghost, Heart, Rocket, Laugh, Globe } from 'lucide-react'
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
  const [showControls, setShowControls] = useState(true)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [subtitleLang, setSubtitleLang] = useState<SubtitleLang>('es')
  const [showSubtitles, setShowSubtitles] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [videoStarted, setVideoStarted] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const hideTimer = useRef<NodeJS.Timeout>()
  const progressInterval = useRef<NodeJS.Timeout>()

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

  // Progress simulation
  useEffect(() => {
    if (isPlaying && progress < 100) {
      progressInterval.current = setInterval(() => setProgress(p => Math.min(p + 0.1, 100)), 100)
      return () => { if (progressInterval.current) clearInterval(progressInterval.current) }
    }
  }, [isPlaying, progress])

  const displayedSubtitle = useMemo(() => {
    if (!showSubtitles || !isPlaying) return ''
    const sceneIndex = Math.floor(progress / 3) * 3
    return SCENE_SUBTITLES[subtitleLang][sceneIndex] || ''
  }, [progress, subtitleLang, showSubtitles, isPlaying])

  const formatTime = useCallback((p: number) => {
    const total = movie.duration * 60
    const current = Math.floor((p / 100) * total)
    const m = Math.floor(current / 60)
    const s = current % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [movie.duration])

  // Force play video via postMessage to YouTube iframe
  const forcePlay = useCallback(() => {
    if (iframeRef.current) {
      // YouTube iframe API postMessage
      iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
    }
    setIsPlaying(true)
    setVideoStarted(true)
  }, [])

  const handlePlay = () => {
    if (!videoStarted) {
      forcePlay()
    } else {
      setIsPlaying(!isPlaying)
      if (!isPlaying && iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
      } else if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
      }
    }
  }
  
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

  const isTelegram = movie.videoUrl?.includes('t.me')
  const isGoogleDrive = movie.videoUrl?.includes('drive.google.com')
  const isYouTube = movie.videoUrl?.includes('youtube') || movie.videoUrl?.includes('youtu.be')

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black" onMouseMove={() => setShowControls(true)}>
      
      {/* LANDSCAPE MODE */}
      {orientation === 'landscape' && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          {/* Video container - tamaño ajustado */}
          <div 
            className="relative bg-black overflow-hidden rounded-lg"
            style={{ 
              width: '90vw',
              height: 'calc(90vw * 9 / 16)',
              maxHeight: '85vh',
              maxWidth: 'calc(85vh * 16 / 9)'
            }}
          >
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
            
            {/* Google Drive */}
            {isGoogleDrive && (
              <iframe 
                src={movie.videoUrl?.replace('/view', '/preview')} 
                className="w-full h-full" 
                allow="autoplay"
                allowFullScreen
              />
            )}
            
            {/* Telegram */}
            {isTelegram && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0088cc] to-[#0055aa]">
                <Play className="w-16 h-16 text-white mb-4" fill="white" />
                <p className="text-white text-lg mb-4">Contenido de Telegram</p>
                <a href={movie.videoUrl} target="_blank" rel="noopener" className="bg-white text-[#0088cc] px-6 py-2 rounded-full font-medium">Ver en Telegram</a>
              </div>
            )}
            
            {/* Otros */}
            {!isYouTube && !isGoogleDrive && !isTelegram && (
              <img src={movie.thumbnail} alt={movie.title} className="w-full h-full object-cover" />
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
            {isYouTube && !videoStarted && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button onClick={forcePlay} className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </button>
              </div>
            )}
            
            {/* Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-white text-xs">{formatTime(progress)}</span>
                <div className="flex-1 h-1 bg-white/30 rounded-full cursor-pointer" onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setProgress(((e.clientX - rect.left) / rect.width) * 100)
                }}>
                  <div className="h-full bg-red-600 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-white text-xs">{formatTime(100)}</span>
              </div>
              <div className="flex justify-between">
                <div className="flex gap-3">
                  <button onClick={handlePlay} className="text-white">{isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}</button>
                  <button onClick={() => setIsMuted(!isMuted)} className="text-white">{isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
                </div>
                <button onClick={toggleFullscreen} className="text-white">{isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</button>
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
