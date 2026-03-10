'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { X, Play, Pause, Volume2, VolumeX, RotateCw, Subtitles, Languages, ChevronDown, Loader2 } from 'lucide-react'
import type { Movie } from '@/types'

interface CoverPlayerProps {
  movie: Movie
  onClose: () => void
}

type SubtitleLang = 'es' | 'en' | 'fr'

const LANG_NAMES: Record<SubtitleLang, string> = { es: 'Español', en: 'English', fr: 'Français' }

const SUBTITLES: Record<SubtitleLang, string[]> = {
  es: ['Esta es una película increíble...', 'Los actores hacen un gran trabajo.', 'El final te sorprenderá.', 'Una obra maestra del cine.'],
  en: ['This is an amazing movie...', 'The actors do a great job.', 'The ending will surprise you.', 'A masterpiece of cinema.'],
  fr: ["C'est un film incroyable...", 'Les acteurs font un excellent travail.', 'La fin vous surprendra.', 'Un chef-d\'œuvre du cinéma.']
}

export default function CoverPlayer({ movie, onClose }: CoverPlayerProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [subtitleLang, setSubtitleLang] = useState<SubtitleLang>('es')
  const [showSubtitles, setShowSubtitles] = useState(true)
  const [isTranslating, setIsTranslating] = useState(false)
  
  const hideTimer = useRef<NodeJS.Timeout>()

  // Current subtitle based on progress and language (memoized)
  const currentSubtitle = useMemo(() => {
    if (!showSubtitles || !isPlaying) return ''
    const subs = SUBTITLES[subtitleLang]
    return subs[Math.floor(progress / 25) % subs.length]
  }, [progress, subtitleLang, showSubtitles, isPlaying])

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      hideTimer.current = setTimeout(() => setShowControls(false), 3000)
    }
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current) }
  }, [showControls, isPlaying])

  // Progress simulation
  useEffect(() => {
    if (isPlaying && progress < 100) {
      const interval = setInterval(() => setProgress(p => Math.min(p + 0.5, 100)), 1000)
      return () => clearInterval(interval)
    }
  }, [isPlaying, progress])

  // Translate when language changes
  const handleLanguageChange = useCallback((lang: SubtitleLang) => {
    setSubtitleLang(lang)
    setShowLangMenu(false)
    
    if (lang !== 'es') {
      setIsTranslating(true)
      const currentText = SUBTITLES.es[Math.floor(progress / 25) % 4]
      
      fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentText, from: 'es', to: lang })
      })
        .then(res => res.json())
        .then(data => {
          // For now, use pre-translated subtitles for instant response
          // API translation would replace SUBTITLES dynamically
        })
        .catch(() => {})
        .finally(() => setIsTranslating(false))
    }
  }, [progress])

  const formatTime = (p: number) => {
    const total = movie.duration * 60
    const current = Math.floor((p / 100) * total)
    const m = Math.floor(current / 60)
    const s = current % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handlePlay = () => {
    setIsPlaying(!isPlaying)
    setIsRevealed(true)
  }

  const getVideoContent = () => {
    const url = movie.videoUrl || ''
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const embedUrl = url.includes('embed') ? url : 
        url.includes('watch') ? `https://www.youtube.com/embed/${url.split('v=')[1]?.split('&')[0]}` :
        `https://www.youtube.com/embed/${url.split('youtu.be/')[1]}`
      return <iframe src={`${embedUrl}?autoplay=1&controls=0`} className="w-full h-full" allow="autoplay; fullscreen" />
    }
    if (url.includes('drive.google.com')) {
      return <iframe src={url.replace('/view', '/preview')} className="w-full h-full" allow="autoplay" />
    }
    if (url.includes('t.me')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0088cc] to-[#0055aa]">
          <div className="text-center">
            <Play className="w-16 h-16 text-white mx-auto mb-4" />
            <p className="text-white mb-4">Contenido de Telegram</p>
            <a href={url} target="_blank" rel="noopener" className="bg-white text-[#0088cc] px-6 py-2 rounded-full font-medium hover:bg-gray-100">Ver en Telegram</a>
          </div>
        </div>
      )
    }
    return <img src={movie.thumbnail} alt={movie.title} className="w-full h-full object-cover opacity-50" />
  }

  return (
    <div className="fixed inset-0 z-50 bg-black" onMouseMove={() => setShowControls(true)}>
      <button onClick={onClose} className={`absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white transition ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <X className="w-5 h-5" />
      </button>

      {/* Cover Layer */}
      {!isRevealed && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
          <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-md" style={{ backgroundImage: `url(${movie.thumbnail})` }} />
          <div className="relative text-center px-4">
            <div className="w-20 h-20 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/50 animate-pulse">
              <Play className="w-10 h-10 text-white ml-1" fill="white" />
            </div>
            <h2 className="text-white text-xl font-bold mb-2">{movie.title}</h2>
            <p className="text-gray-400 text-sm mb-6">Rota tu dispositivo para ver</p>
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <RotateCw className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-xs">Gira 90° para disfrutar</span>
            </div>
          </div>
        </div>
      )}

      {/* Real Content */}
      {(isRevealed || isPlaying) && (
        <div className="absolute inset-0 bg-black">
          {getVideoContent()}
          {showSubtitles && isPlaying && currentSubtitle && (
            <div className="absolute bottom-24 left-0 right-0 text-center px-4">
              <span className="inline-flex items-center gap-2 bg-black/80 text-white px-4 py-2 rounded text-lg">
                {isTranslating && <Loader2 className="w-4 h-4 animate-spin" />}
                {currentSubtitle}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Controls Overlay */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center">
          <h3 className="text-white font-medium truncate">{movie.title}</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded text-white text-sm hover:bg-white/20">
                <Languages className="w-4 h-4" /> {LANG_NAMES[subtitleLang]} <ChevronDown className="w-3 h-3" />
              </button>
              {showLangMenu && (
                <div className="absolute top-full right-0 mt-1 bg-gray-900 rounded-lg overflow-hidden z-10 min-w-[120px]">
                  {(['es', 'en', 'fr'] as SubtitleLang[]).map(l => (
                    <button key={l} onClick={() => handleLanguageChange(l)} className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-800 ${subtitleLang === l ? 'text-red-500 bg-gray-800/50' : 'text-white'}`}>
                      {LANG_NAMES[l]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setShowSubtitles(!showSubtitles)} className={`p-2 rounded transition ${showSubtitles ? 'bg-red-600' : 'bg-white/10'} text-white`}>
              <Subtitles className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Play */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button onClick={handlePlay} className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center hover:bg-white/30 transition pointer-events-auto">
            {isPlaying ? <Pause className="w-8 h-8 text-white" fill="white" /> : <Play className="w-8 h-8 text-white ml-1" fill="white" />}
          </button>
        </div>

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-white text-sm">{formatTime(progress)}</span>
            <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer" onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              setProgress((x / rect.width) * 100)
            }}>
              <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-white text-sm">{movie.duration}:00</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={handlePlay} className="text-white hover:text-gray-300">{isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}</button>
              <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-gray-300">{isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}</button>
            </div>
            <button onClick={() => setIsRevealed(!isRevealed)} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded text-white text-sm hover:bg-white/20">
              <RotateCw className="w-4 h-4" /> {isRevealed ? 'Ocultar' : 'Revelar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
