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
  createdAt: Date
  updatedAt: Date
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
