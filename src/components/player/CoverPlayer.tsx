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

// Subtítulos sincronizados con retraso (simulando tiempo de habla del actor)
const SCENE_SUBTITLES: Record<SubtitleLang, Record<number, { text: string; delay: number }>> = {
  es: {
    0: { text: 'La historia comienza en una noche oscura...', delay: 500 },
    5: { text: '¿Quién está ahí?', delay: 800 },
    7: { text: '—preguntó con voz temblorosa.', delay: 300 },
    10: { text: 'No tengas miedo.', delay: 600 },
    12: { text: 'Estoy aquí para ayudarte.', delay: 400 },
    15: { text: 'Debemos irnos ahora...', delay: 700 },
    18: { text: '...antes de que sea demasiado tarde.', delay: 500 },
    20: { text: 'El camino será peligroso.', delay: 600 },
    23: { text: 'Pero juntos podemos hacerlo.', delay: 400 },
    25: { text: '¡Mira! Allí está la salida.', delay: 500 },
    30: { text: 'No puedo creer lo que estamos viendo.', delay: 600 },
    35: { text: 'Esto cambiará todo para siempre.', delay: 500 },
    40: { text: 'Tenemos que ser fuertes.', delay: 400 },
    43: { text: 'En este momento.', delay: 300 },
    45: { text: 'El destino nos ha unido por una razón.', delay: 600 },
    50: { text: '¿Recuerdas cuando todo esto comenzó?', delay: 500 },
    55: { text: 'Parece que fue ayer...', delay: 600 },
    58: { text: '...pero ha pasado tanto tiempo.', delay: 400 },
    60: { text: 'No me arrepiento de nada.', delay: 500 },
    65: { text: 'Cada momento valió la pena.', delay: 400 },
    70: { text: 'Lo logramos.', delay: 300 },
    73: { text: 'Finalmente lo logramos.', delay: 500 },
    75: { text: 'Pero esto solo es el comienzo.', delay: 500 },
    80: { text: 'Hay mucho más por descubrir.', delay: 500 },
    85: { text: 'El futuro nos depara grandes sorpresas.', delay: 600 },
    90: { text: 'Estoy listo para lo que venga.', delay: 500 },
    95: { text: 'Y así, nuestra historia continúa...', delay: 700 }
  },
  en: {
    0: { text: 'The story begins on a dark night...', delay: 500 },
    5: { text: 'Who is there?', delay: 800 },
    7: { text: '—he asked with a trembling voice.', delay: 300 },
    10: { text: "Don't be afraid.", delay: 600 },
    12: { text: "I'm here to help you.", delay: 400 },
    15: { text: 'We must leave now...', delay: 700 },
    18: { text: "...before it's too late.", delay: 500 },
    20: { text: 'The path will be dangerous.', delay: 600 },
    23: { text: 'But together we can do it.', delay: 400 },
    25: { text: 'Look! There is the exit.', delay: 500 },
    30: { text: "I can't believe what we're seeing.", delay: 600 },
    35: { text: 'This will change everything forever.', delay: 500 },
    40: { text: 'We must be strong.', delay: 400 },
    43: { text: 'At this moment.', delay: 300 },
    45: { text: 'Destiny has united us for a reason.', delay: 600 },
    50: { text: 'Do you remember when all this started?', delay: 500 },
    55: { text: 'It seems like yesterday...', delay: 600 },
    58: { text: '...but so much time has passed.', delay: 400 },
    60: { text: "I don't regret anything.", delay: 500 },
    65: { text: 'Every moment was worth it.', delay: 400 },
    70: { text: 'We made it.', delay: 300 },
    73: { text: 'We finally made it.', delay: 500 },
    75: { text: 'But this is only the beginning.', delay: 500 },
    80: { text: 'There is much more to discover.', delay: 500 },
    85: { text: 'The future holds great surprises for us.', delay: 600 },
    90: { text: "I'm ready for what comes.", delay: 500 },
    95: { text: 'And so, our story continues...', delay: 700 }
  },
  fr: {
    0: { text: "L'histoire commence par une nuit sombre...", delay: 500 },
    5: { text: 'Qui est là?', delay: 800 },
    7: { text: "—a-t-il demandé d'une voix tremblante.", delay: 300 },
    10: { text: "N'aie pas peur.", delay: 600 },
    12: { text: 'Je suis là pour taider.', delay: 400 },
    15: { text: 'Nous devons partir maintenant...', delay: 700 },
    18: { text: '...avant quil soit trop tard.', delay: 500 },
    20: { text: 'Le chemin sera dangereux.', delay: 600 },
    23: { text: 'Mais ensemble nous pouvons le faire.', delay: 400 },
    25: { text: 'Regarde! La sortie est là.', delay: 500 },
    30: { text: "Je n'arrive pas à croire ce que nous voyons.", delay: 600 },
    35: { text: 'Cela va tout changer pour toujours.', delay: 500 },
    40: { text: 'Nous devons être forts.', delay: 400 },
    43: { text: 'En ce moment.', delay: 300 },
    45: { text: 'Le destin nous a unis pour une raison.', delay: 600 },
    50: { text: 'Te souviens-tu quand tout cela a commencé?', delay: 500 },
    55: { text: 'On dirait que cétait hier...', delay: 600 },
    58: { text: '...mais tant de temps a passé.', delay: 400 },
    60: { text: 'Je ne regrette rien.', delay: 500 },
    65: { text: 'Chaque instant en valait la peine.', delay: 400 },
    70: { text: 'Nous y sommes arrivés.', delay: 300 },
    73: { text: 'Nous y sommes enfin arrivés.', delay: 500 },
    75: { text: "Mais ce n'est que le début.", delay: 500 },
    80: { text: 'Il y a tellement plus à découvrir.', delay: 500 },
    85: { text: "L'avenir nous réserve de grandes surprises.", delay: 600 },
    90: { text: 'Je suis prêt pour ce qui vient.', delay: 500 },
    95: { text: 'Et ainsi, notre histoire continue...', delay: 700 }
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

  // Subtitle sync - calculated with memo
  const displayedSubtitle = useMemo(() => {
    if (!showSubtitles || !isPlaying) return ''
    const sceneIndex = Math.floor(progress / 3) * 3
    const sceneData = SCENE_SUBTITLES[subtitleLang][sceneIndex]
    return sceneData?.text || ''
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
      return `https://www.youtube.com/embed/${url.split('v=')[1]?.split('&')[0]}?autoplay=1&controls=0&modestbranding=1&rel=0`
    }
    if (url.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${url.split('youtu.be/')[1]}?autoplay=1&controls=0&modestbranding=1&rel=0`
    }
    if (url.includes('youtube.com/embed')) {
      return `${url}?autoplay=1&controls=0&modestbranding=1&rel=0`
    }
    return url
  }

  const isTelegram = movie.videoUrl?.includes('t.me')
  const isGoogleDrive = movie.videoUrl?.includes('drive.google.com')
  const isYouTube = movie.videoUrl?.includes('youtube') || movie.videoUrl?.includes('youtu.be')

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-black" onMouseMove={() => setShowControls(true)}>
      
      {/* LANDSCAPE MODE - Video redimensionado con fondo negro */}
      {orientation === 'landscape' && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          {/* Video container - más pequeño, centrado */}
          <div 
            className="relative bg-black rounded-lg overflow-hidden shadow-2xl"
            style={{ 
              width: '85vw',
              height: 'calc(85vw * 9 / 16)',
              maxHeight: '85vh',
              maxWidth: 'calc(85vh * 16 / 9)'
            }}
          >
            {/* Video Embed */}
            {isYouTube && isPlaying && (
              <iframe 
                src={getEmbedUrl()} 
                className="w-full h-full" 
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            )}
            {isGoogleDrive && isPlaying && (
              <iframe 
                src={movie.videoUrl?.replace('/view', '/preview')} 
                className="w-full h-full" 
                allow="autoplay"
                allowFullScreen
              />
            )}
            {isTelegram && isPlaying && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0088cc] to-[#0055aa]">
                <Play className="w-16 h-16 text-white mb-4" fill="white" />
                <p className="text-white text-lg mb-4">Contenido de Telegram</p>
                <a href={movie.videoUrl} target="_blank" rel="noopener" className="bg-white text-[#0088cc] px-6 py-2 rounded-full font-medium">Ver en Telegram</a>
              </div>
            )}
            {(!isYouTube && !isGoogleDrive && !isTelegram) && (
              <img src={movie.thumbnail} alt={movie.title} className="w-full h-full object-cover" />
            )}
            
            {/* Placeholder cuando no está reproduciendo */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <img src={movie.thumbnail} alt={movie.title} className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button onClick={handlePlay} className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition">
                    <Play className="w-10 h-10 text-white ml-1" fill="white" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Subtítulos */}
            {showSubtitles && isPlaying && displayedSubtitle && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4">
                <span className="bg-black/90 text-white px-4 py-2 rounded text-base font-medium max-w-[90%] text-center">
                  {displayedSubtitle}
                </span>
              </div>
            )}
          </div>
          
          {/* Controles */}
          <div className={`absolute inset-0 transition-opacity ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50" />
            
            {/* Top */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
              <div>
                <h3 className="text-white text-xl font-bold">{movie.title}</h3>
                <p className="text-gray-300 text-sm">{movie.year} • {movie.category}</p>
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
            
            {/* Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-3 mb-3">
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
                  <button onClick={handlePlay} className="text-white">{isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}</button>
                  <button onClick={() => setIsMuted(!isMuted)} className="text-white">{isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}</button>
                </div>
                <button onClick={toggleFullscreen} className="text-white">{isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* PORTRAIT MODE - Tapa fake Netflix */}
      {orientation === 'portrait' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: `url(${movie.thumbnail})` }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/80" />
          
          <div className="relative z-10 text-center px-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/50 animate-pulse">
              <Play className="w-12 h-12 text-white ml-1" fill="white" />
            </div>
            <h2 className="text-white text-2xl font-bold mb-2">{movie.title}</h2>
            <p className="text-gray-300 text-sm mb-1">{movie.year} • {movie.duration} min • ⭐ {movie.rating}</p>
            <p className="text-gray-400 text-xs mb-6 line-clamp-2">{movie.description}</p>
            
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M12 18h.01" />
              </svg>
              <span>Rota tu dispositivo para ver</span>
            </div>
            
            <button onClick={onClose} className="mt-6 px-5 py-2 bg-white/10 rounded-full text-white text-sm hover:bg-white/20 transition">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  )
}
