// Demo movies with real YouTube trailers
// These will be loaded by default and can be managed via Admin Panel

export interface Movie {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl: string // YouTube embed URL or Google Drive embed
  category: string
  year: number
  duration: number // in minutes
  rating: number
  featured: boolean
  language: string
  createdAt?: Date
  updatedAt?: Date
}

// Convert YouTube watch URL to embed URL
export function getYouTubeEmbedUrl(url: string): string {
  if (url.includes('youtube.com/embed')) return url
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1]?.split('&')[0]
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1`
  }
  if (url.includes('youtu.be')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0]
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1`
  }
  return url
}

// Demo movies with real YouTube trailers
export const DEMO_MOVIES: Movie[] = [
  {
    id: '1',
    title: 'Dune: Parte Dos',
    description: 'Paul Atreides se une a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia. Debe elegir entre el amor de su vida y el destino del universo.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
    videoUrl: 'https://www.youtube.com/embed/Way9DexnyUs',
    category: 'ciencia-ficcion',
    year: 2024,
    duration: 166,
    rating: 8.8,
    featured: true,
    language: 'Español'
  },
  {
    id: '2',
    title: 'Oppenheimer',
    description: 'La historia del físico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica durante la Segunda Guerra Mundial.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    videoUrl: 'https://www.youtube.com/embed/uYPbbksJxIg',
    category: 'drama',
    year: 2023,
    duration: 180,
    rating: 8.9,
    featured: true,
    language: 'Español'
  },
  {
    id: '3',
    title: 'Spider-Man: Cruzando el Multiverso',
    description: 'Miles Morales regresa para una nueva aventura a través del multiverso, donde se encontrará con diferentes versiones de Spider-Man.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    videoUrl: 'https://www.youtube.com/embed/shW9i6k8cB0',
    category: 'animacion',
    year: 2023,
    duration: 140,
    rating: 8.7,
    featured: true,
    language: 'Español'
  },
  {
    id: '4',
    title: 'John Wick 4',
    description: 'John Wick descubre un camino para derrotar a La Mesa Alta, pero antes debe enfrentarse a un nuevo enemigo con poderosas alianzas.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
    videoUrl: 'https://www.youtube.com/embed/qEVUtrk8_B4',
    category: 'accion',
    year: 2023,
    duration: 169,
    rating: 8.2,
    featured: false,
    language: 'Español'
  },
  {
    id: '5',
    title: 'Barbie',
    description: 'Barbie y Ken están disfrutando de su vida perfecta en Barbie Land. Pero cuando tienen la oportunidad de ir al mundo real, descubren las alegrías y peligros de vivir entre los humanos.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
    videoUrl: 'https://www.youtube.com/embed/pBk4NYhWNMM',
    category: 'comedia',
    year: 2023,
    duration: 114,
    rating: 7.0,
    featured: false,
    language: 'Español'
  },
  {
    id: '6',
    title: 'Pobres Criaturas',
    description: 'La historia de Bella Baxter, una joven resucitada por el científico Dr. Godwin Baxter, que emprende un viaje de autodescubrimiento.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg',
    videoUrl: 'https://www.youtube.com/embed/RlbR5N6veqw',
    category: 'drama',
    year: 2023,
    duration: 141,
    rating: 8.0,
    featured: false,
    language: 'Español'
  },
  {
    id: '7',
    title: 'Misión Imposible: Sentencia Mortal',
    description: 'Ethan Hunt se enfrenta a su misión más peligrosa: una nueva amenaza que podría destruir el mundo conocido.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg',
    videoUrl: 'https://www.youtube.com/embed/avz06PDqDbM',
    category: 'accion',
    year: 2023,
    duration: 163,
    rating: 7.8,
    featured: false,
    language: 'Español'
  },
  {
    id: '8',
    title: 'Guardianes de la Galaxia Vol. 3',
    description: 'Los Guardianes deben proteger a uno de los suyos mientras lidian con un nuevo y poderoso enemigo.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
    videoUrl: 'https://www.youtube.com/embed/u3V5KDHRQvk',
    category: 'ciencia-ficcion',
    year: 2023,
    duration: 150,
    rating: 8.0,
    featured: false,
    language: 'Español'
  },
  {
    id: '9',
    title: 'El Exorcista: Creyente',
    description: 'Dos niñas desaparecen en el bosque y regresan tres días después sin recordar nada. Pronto, sus padres descubren que algo maligno las ha poseído.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/qVKirUdmoex8SdfUk8WDM3AkfGP.jpg',
    videoUrl: 'https://www.youtube.com/embed/oHg5SJYRHA0',
    category: 'terror',
    year: 2023,
    duration: 111,
    rating: 5.2,
    featured: false,
    language: 'Español'
  },
  {
    id: '10',
    title: 'Napoleón',
    description: 'La historia épica de Napoleón Bonaparte, desde sus inicios hasta convertirse en emperador de Francia.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/jE5o7y9K6pZtWNNMXw3EdpHaakR.jpg',
    videoUrl: 'https://www.youtube.com/embed/LIHKjZL3jGc',
    category: 'drama',
    year: 2023,
    duration: 158,
    rating: 6.5,
    featured: false,
    language: 'Español'
  },
  {
    id: '11',
    title: 'Wonka',
    description: 'La historia del joven Willy Wonka y cómo se convirtió en el famoso chocolatero que todos conocemos.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/qhb1qOilapbapxWQn9jtRCMwXJF.jpg',
    videoUrl: 'https://www.youtube.com/embed/otNh9bTjXWg',
    category: 'comedia',
    year: 2023,
    duration: 116,
    rating: 7.2,
    featured: false,
    language: 'Español'
  },
  {
    id: '12',
    title: 'Aquaman y el Reino Perdido',
    description: 'Aquaman debe forjar una alianza incómoda con su hermano para proteger Atlantis de un antiguo mal.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/7lTnXOy0iNtBAdRP3TZvaKJ77F6.jpg',
    videoUrl: 'https://www.youtube.com/embed/UGc5Tzz19UY',
    category: 'accion',
    year: 2023,
    duration: 124,
    rating: 6.0,
    featured: false,
    language: 'Español'
  }
]

export const CATEGORIES = [
  { id: 'todas', name: 'Todas', icon: 'Grid' },
  { id: 'accion', name: 'Acción', icon: 'Zap' },
  { id: 'drama', name: 'Drama', icon: 'Theater' },
  { id: 'comedia', name: 'Comedia', icon: 'Laugh' },
  { id: 'ciencia-ficcion', name: 'Ciencia Ficción', icon: 'Rocket' },
  { id: 'terror', name: 'Terror', icon: 'Ghost' },
  { id: 'romance', name: 'Romance', icon: 'Heart' },
  { id: 'animacion', name: 'Animación', icon: 'Sparkles' },
  { id: 'documental', name: 'Documental', icon: 'Film' },
]
