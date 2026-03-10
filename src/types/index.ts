export interface Movie {
  id: string
  title: string
  description: string | null
  thumbnail: string
  videoUrl: string
  category: string
  year: number
  duration: number
  rating: number
  featured: boolean
  language: string
  createdAt?: Date
  updatedAt?: Date
  // Campos para videos de Telegram
  fileId?: string
  thumbnailFileId?: string
  telegramLink?: string
  channelMessageId?: number
  channelUsername?: string
  fileName?: string
  fileSize?: number
  addedBy?: string
}

export interface Category {
  id: string
  name: string
  icon: string
}

export const CATEGORIES: Category[] = [
  { id: 'todas', name: 'Todas', icon: 'Grid' },
  { id: 'accion', name: 'Acción', icon: 'Zap' },
  { id: 'drama', name: 'Drama', icon: 'Theater' },
  { id: 'comedia', name: 'Comedia', icon: 'Laugh' },
  { id: 'ciencia-ficcion', name: 'Ciencia Ficción', icon: 'Rocket' },
  { id: 'terror', name: 'Terror', icon: 'Ghost' },
  { id: 'romance', name: 'Romance', icon: 'Heart' },
  { id: 'aventura', name: 'Aventura', icon: 'Map' },
  { id: 'animacion', name: 'Animación', icon: 'Sparkles' },
  { id: 'documental', name: 'Documental', icon: 'Film' },
]

// Convert YouTube URL to embed format
export function getYouTubeEmbedUrl(url: string): string {
  if (!url) return ''
  if (url.includes('youtube.com/embed')) return url
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1]?.split('&')[0]
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1`
  }
  if (url.includes('youtu.be')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0]
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1`
  }
  // Google Drive embed
  if (url.includes('drive.google.com')) {
    const fileId = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`
    }
  }
  return url
}
