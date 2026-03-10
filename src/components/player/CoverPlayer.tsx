'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Subtitles, Languages, ChevronDown, Maximize, Minimize } from 'lucide-react'
import type { Movie } from '@/types'

interface CoverPlayerProps {
  movie: Movie
  onClose: () => void
}

type SubtitleLang = 'es' | 'en' | 'fr'

const LANG_NAMES: Record<SubtitleLang, string> = { es: 'Español', en: 'English', fr: 'Français' }

// Subtítulos por escena según progreso
const SCENE_SUBTITLES: Record<SubtitleLang, Record<number, string>> = {
  es: {
    0: 'La historia comienza en una noche oscura...',
    5: '¿Quién está ahí? - preguntó con voz temblorosa.',
    10: 'No tengas miedo. Estoy aquí para ayudarte.',
    15: 'Debemos irnos ahora, antes de que sea demasiado tarde.',
    20: 'El camino será peligroso, pero juntos podemos hacerlo.',
    25: '¡Mira! Allí está la salida.',
    30: 'No puedo creer lo que estamos viendo.',
    35: 'Esto cambiará todo para siempre.',
    40: 'Tenemos que ser fuertes en este momento.',
    45: 'El destino nos ha unido por una razón.',
    50: '¿Recuerdas cuando todo esto comenzó?',
    55: 'Parece que fue ayer, pero ha pasado tanto tiempo.',
    60: 'No me arrepiento de nada.',
    65: 'Cada momento valió la pena.',
    70: 'Lo logramos. Finalmente lo logramos.',
    75: 'Pero esto solo es el comienzo.',
    80: 'Hay mucho más por descubrir.',
    85: 'El futuro nos depara grandes sorpresas.',
    90: 'Estoy listo para lo que venga.',
    95: 'Y así, nuestra historia continúa...'
  },
  en: {
    0: 'The story begins on a dark night...',
    5: 'Who is there? - he asked with a trembling voice.',
    10: "Don't be afraid. I'm here to help you.",
    15: "We must leave now, before it's too late.",
    20: 'The path will be dangerous, but together we can do it.',
    25: 'Look! There is the exit.',
    30: "I can't believe what we're seeing.",
    35: 'This will change everything forever.',
    40: 'We must be strong at this moment.',
    45: 'Destiny has united us for a reason.',
    50: 'Do you remember when all this started?',
    55: 'It seems like yesterday, but so much time has passed.',
    60: "I don't regret anything.",
    65: 'Every moment was worth it.',
    70: 'We made it. We finally made it.',
    75: 'But this is only the beginning.',
    80: 'There is much more to discover.',
    85: 'The future holds great surprises for us.',
    90: "I'm ready for what comes.",
    95: 'And so, our story continues...'
  },
  fr: {
    0: "L'histoire commence par une nuit sombre...",
    5: "Qui est là? - a-t-il demandé d'une voix tremblante.",
    10: "N'aie pas peur. Je suis là pour t'aider.",
    15: "Nous devons partir maintenant, avant qu'il ne soit trop tard.",
    20: 'Le chemin sera dangereux, mais ensemble nous pouvons le faire.',
    25: 'Regarde! La sortie est là.',
    30: "Je n'arrive pas à croire ce que nous voyons.",
    35: 'Cela va tout changer pour toujours.',
    40: 'Nous devons être forts en ce moment.',
    45: 'Le destin nous a unis pour une raison.',
    50: 'Te souviens-tu quand tout cela a commencé?',
    55: "On dirait que c'était hier, mais tant de temps a passé.",
    60: 'Je ne regrette rien.',
    65: 'Chaque instant en valait la peine.',
    70: "Nous y sommes arrivés. Nous y sommes enfin arrivés.",
    75: "Mais ce n'est que le début.",
    80: 'Il y a tellement plus à découvrir.',
    85: "L'avenir nous réserve de grandes surprises.",
    90: 'Je suis prêt pour ce qui vient.',
    95: 'Et ainsi, notre histoire continue...'
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
  
  const containerRef = useRef<HTMLDivElement>(null)
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

  const currentSubtitle = useMemo(() => {
    if (!showSubtitles || !isPlaying) return ''
    const sceneIndex = Math.floor(progress / 5) * 5
    return SCENE_SUBTITLES[subtitleLang][sceneIndex] || SCENE_SUBTITLES[subtitleLang][0]
  }, [progress, subtitleLang, showSubtitles, isPlaying])

  const formatTime = useCallback((p: number) => {
    const total = movie.duration * 60
    const current = Math.floor((p / 100) * total)
    const m = Math.floor(current / 60)
    const s = current % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [movie.duration])

  const handlePlay = () => setIsPlaying(!isPlaying)
  
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
    if (url.includes('youtube.com/watch')) {
      return `https://www.youtube.com/embed/${url.split('v=')[1]?.split('&')[0]}?autoplay=1&controls=0`
    }
    if (url.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${url.split('youtu.be/')[1]}?autoplay=1&controls=0`
    }
    if (url.includes('youtube.com/embed')) {
      return `${url}?autoplay=1&controls=0`
    }
    return url
  }

  const isTelegram = movie.videoUrl?.includes('t.me')
  const isGoogleDrive = movie.videoUrl?.includes('drive.google.com')
  const isYouTube = movie.videoUrl?.includes('youtube') || movie.videoUrl?.includes('youtu.be')

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black" onMouseMove={() => setShowControls(true)}>
      
      {/* LANDSCAPE MODE - Video centrado con fondo negro */}
      {orientation === 'landscape' && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center">
            
            {/* Video Embed */}
            {isYouTube && (
              <iframe src={getEmbedUrl()} className="w-full h-full max-w-[177vh] max-h-[56vw]" allow="autoplay; fullscreen" />
            )}
            {isGoogleDrive && (
              <iframe src={movie.videoUrl?.replace('/view', '/preview')} className="w-full h-full" allow="autoplay" />
            )}
            {isTelegram && (
              <div className="flex flex-col items-center justify-center text-center">
                <Play className="w-20 h-20 text-white mb-4" fill="white" />
                <p className="text-white text-xl mb-4">Contenido de Telegram</p>
                <a href={movie.videoUrl} target="_blank" rel="noopener" className="bg-white text-[#0088cc] px-6 py-2 rounded-full">Ver en Telegram</a>
              </div>
            )}
            {!isYouTube && !isGoogleDrive && !isTelegram && (
              <img src={movie.thumbnail} alt={movie.title} className="max-w-full max-h-full object-contain" />
            )}
            
            {/* Subtítulos */}
            {showSubtitles && isPlaying && currentSubtitle && (
              <div className="absolute bottom-20 left-0 right-0 text-center">
                <span className="bg-black/90 text-white px-6 py-3 rounded-lg text-xl">{currentSubtitle}</span>
              </div>
            )}
          </div>
          
          {/* Controles */}
          <div className={`absolute inset-0 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50" />
            
            {/* Top */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between">
              <div>
                <h3 className="text-white text-2xl font-bold">{movie.title}</h3>
                <p className="text-gray-300 text-sm">{movie.year} • {movie.category}</p>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg text-white">
                    <Languages className="w-5 h-5" /> {LANG_NAMES[subtitleLang]} <ChevronDown className="w-4 h-4" />
                  </button>
                  {showLangMenu && (
                    <div className="absolute top-full right-0 mt-2 bg-gray-900 rounded-xl overflow-hidden">
                      {(['es', 'en', 'fr'] as SubtitleLang[]).map(l => (
                        <button key={l} onClick={() => { setSubtitleLang(l); setShowLangMenu(false) }} className={`block w-full px-4 py-3 text-left ${subtitleLang === l ? 'text-red-500' : 'text-white'} hover:bg-gray-800`}>
                          {LANG_NAMES[l]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setShowSubtitles(!showSubtitles)} className={`p-3 rounded-lg ${showSubtitles ? 'bg-red-600' : 'bg-white/10'} text-white`}>
                  <Subtitles className="w-5 h-5" />
                </button>
                <button onClick={onClose} className="p-3 bg-white/10 rounded-lg text-white"><X className="w-5 h-5" /></button>
              </div>
            </div>
            
            {/* Center Play */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button onClick={handlePlay} className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center pointer-events-auto">
                {isPlaying ? <Pause className="w-10 h-10 text-white" fill="white" /> : <Play className="w-10 h-10 text-white ml-1" fill="white" />}
              </button>
            </div>
            
            {/* Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-white text-sm">{formatTime(progress)}</span>
                <div className="flex-1 h-1.5 bg-white/30 rounded-full cursor-pointer" onClick={e => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setProgress(((e.clientX - rect.left) / rect.width) * 100)
                }}>
                  <div className="h-full bg-red-600 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-white text-sm">{formatTime(100)}</span>
              </div>
              <div className="flex justify-between">
                <div className="flex gap-4">
                  <button onClick={handlePlay} className="text-white">{isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}</button>
                  <button onClick={() => setIsMuted(!isMuted)} className="text-white">{isMuted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}</button>
                </div>
                <button onClick={toggleFullscreen} className="text-white">{isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* PORTRAIT MODE - Tapa fake Netflix */}
      {orientation === 'portrait' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${movie.thumbnail})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/80" />
          
          <div className="relative z-10 text-center px-8">
            <div className="w-28 h-28 mx-auto mb-6 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/50 animate-pulse">
              <Play className="w-14 h-14 text-white ml-2" fill="white" />
            </div>
            <h2 className="text-white text-3xl font-bold mb-3">{movie.title}</h2>
            <p className="text-gray-300 text-sm mb-2">{movie.year} • {movie.duration} min • ⭐ {movie.rating}</p>
            <p className="text-gray-400 text-xs mb-8 line-clamp-2">{movie.description}</p>
            
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <div className="w-8 h-8 border-2 border-gray-400 rounded flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="6" width="16" height="12" rx="2" />
                </svg>
              </div>
              <span className="text-sm">Rota tu dispositivo para ver</span>
            </div>
            
            <button onClick={onClose} className="mt-8 px-6 py-2 bg-white/10 rounded-full text-white text-sm hover:bg-white/20">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
