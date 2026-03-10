// Demo movies with real YouTube trailers
// Thumbnails verificados de TMDB

export interface Movie {
  id: string
  title: string
  description: string
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
}

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

// 50+ películas, series y anime con thumbnails de TMDB
export const DEMO_MOVIES: Movie[] = [
  // PELÍCULAS 2024
  {
    id: '1',
    title: 'Dune: Parte Dos',
    description: 'Paul Atreides se une a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia.',
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
    description: 'La historia del físico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica.',
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
    description: 'Miles Morales regresa para una nueva aventura a través del multiverso.',
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
    description: 'John Wick descubre un camino para derrotar a La Mesa Alta.',
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
    description: 'Barbie y Ken descubren las alegrías y peligros de vivir entre los humanos.',
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
    description: 'La historia de Bella Baxter, una joven resucitada por el científico Dr. Godwin Baxter.',
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
    title: 'Killers of the Flower Moon',
    description: 'La historia de los asesinatos de miembros de la tribu Osage en Oklahoma durante los años 1920.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg',
    videoUrl: 'https://www.youtube.com/embed/EP34Yoxs3FQ',
    category: 'drama',
    year: 2023,
    duration: 206,
    rating: 8.5,
    featured: false,
    language: 'Español'
  },
  {
    id: '8',
    title: 'Guardianes de la Galaxia Vol. 3',
    description: 'Los Guardianes deben proteger a uno de los suyos.',
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
    title: 'The Batman',
    description: 'Batman investiga la corrupción de Gotham City y la conexión con su propia familia.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fber9Tav5PXS5qG4.jpg',
    videoUrl: 'https://www.youtube.com/embed/mqqft2x_Aa4',
    category: 'accion',
    year: 2022,
    duration: 176,
    rating: 8.1,
    featured: false,
    language: 'Español'
  },
  {
    id: '10',
    title: 'Top Gun: Maverick',
    description: 'Maverick entrena a una nueva generación de pilotos para una misión peligrosa.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
    videoUrl: 'https://www.youtube.com/embed/giXco2jaZ_4',
    category: 'accion',
    year: 2022,
    duration: 130,
    rating: 8.3,
    featured: false,
    language: 'Español'
  },
  // ANIME
  {
    id: '11',
    title: 'Demon Slayer: Arco del Tren Infinito',
    description: 'Tanjiro y sus amigos se suben al Tren Infinito para investigar desapariciones misteriosas.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/h8Rb9gBr48ODIwYUttZNYeMWeUU.jpg',
    videoUrl: 'https://www.youtube.com/embed/VQGCKyvzIM4',
    category: 'anime',
    year: 2020,
    duration: 117,
    rating: 8.6,
    featured: true,
    language: 'Japonés'
  },
  {
    id: '12',
    title: 'Jujutsu Kaisen 0',
    description: 'Yuta Okkotsu, un estudiante con una maldición peligrosa, es reclutado por Jujutsu High.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/3KPVi7AnkPUyuiviTwPYqdlrJ9H.jpg',
    videoUrl: 'https://www.youtube.com/embed/eHhH0FUfJCk',
    category: 'anime',
    year: 2021,
    duration: 105,
    rating: 8.4,
    featured: false,
    language: 'Japonés'
  },
  {
    id: '13',
    title: 'Suzume',
    description: 'Una chica descubre una puerta misteriosa que lleva a otros mundos.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/qC8getL5wFI2SNP9Xx6dcZf5HXr.jpg',
    videoUrl: 'https://www.youtube.com/embed/S-SU66KsXvA',
    category: 'anime',
    year: 2022,
    duration: 122,
    rating: 8.3,
    featured: false,
    language: 'Japonés'
  },
  {
    id: '14',
    title: 'Attack on Titan: Crónica',
    description: 'Resumen de los eventos principales de Attack on Titan.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/h9R7R9NHLyPvZJCnjTtN6q0zEcV.jpg',
    videoUrl: 'https://www.youtube.com/embed/MGRm4IzK1SQ',
    category: 'anime',
    year: 2022,
    duration: 120,
    rating: 8.8,
    featured: false,
    language: 'Japonés'
  },
  {
    id: '15',
    title: 'Spy x Family: Código Blanco',
    description: 'La familia Forster se infiltra en una academia de élite.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/kCgE9jfGvYIV8fCzAJT7tR0B6ek.jpg',
    videoUrl: 'https://www.youtube.com/embed/ofXigq9aIpo',
    category: 'anime',
    year: 2023,
    duration: 110,
    rating: 8.2,
    featured: false,
    language: 'Japonés'
  },
  {
    id: '16',
    title: 'One Piece Film: Red',
    description: 'Luffy y los Sombreros de Paja asisten a un concierto de la famosa cantante Uta.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/4Y1WNkd88NIoGLuLr0KdBl24w6j.jpg',
    videoUrl: 'https://www.youtube.com/embed/pcmjtQkZ2fQ',
    category: 'anime',
    year: 2022,
    duration: 115,
    rating: 8.0,
    featured: false,
    language: 'Japonés'
  },
  {
    id: '17',
    title: 'Dragon Ball Super: Broly',
    description: 'Goku y Vegeta se enfrentan al legendario Super Saiyan Broly.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/5V6pXAqh9QN5pnkOlqQMzneTzYN.jpg',
    videoUrl: 'https://www.youtube.com/embed/OSSaDzR-Noc',
    category: 'anime',
    year: 2018,
    duration: 101,
    rating: 8.1,
    featured: false,
    language: 'Japonés'
  },
  {
    id: '18',
    title: 'Your Name',
    description: 'Dos adolescentes comparten una conexión mágica después de descubrir que intercambian cuerpos.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg',
    videoUrl: 'https://www.youtube.com/embed/xU47nhrrN00',
    category: 'anime',
    year: 2016,
    duration: 106,
    rating: 8.9,
    featured: false,
    language: 'Japonés'
  },
  {
    id: '19',
    title: 'Spirited Away',
    description: 'Una niña entra en un mundo mágico de espíritus y debe encontrar la forma de salvar a sus padres.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/39wmItIWu64OBdI09txi8bP5hsd.jpg',
    videoUrl: 'https://www.youtube.com/embed/ByXuk9QqQkk',
    category: 'anime',
    year: 2001,
    duration: 125,
    rating: 9.0,
    featured: false,
    language: 'Japonés'
  },
  {
    id: '20',
    title: 'El Viaje de Chihiro',
    description: 'Chihiro debe trabajar en una casa de baños de espíritus para salvar a sus padres.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/rtGDOeG9LzuGxhLhJbexkpW3oKB.jpg',
    videoUrl: 'https://www.youtube.com/embed/ByXuk9QqQkk',
    category: 'anime',
    year: 2001,
    duration: 124,
    rating: 9.0,
    featured: false,
    language: 'Japonés'
  },
  // SERIES
  {
    id: '21',
    title: 'The Last of Us',
    description: 'Un sobreviviente es contratado para sacar a una niña de una zona de cuarentena.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg',
    videoUrl: 'https://www.youtube.com/embed/uLtkt8BonwM',
    category: 'serie',
    year: 2023,
    duration: 60,
    rating: 8.8,
    featured: true,
    language: 'Inglés'
  },
  {
    id: '22',
    title: 'House of the Dragon',
    description: 'La historia de la Casa Targaryen 200 años antes de Game of Thrones.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg',
    videoUrl: 'https://www.youtube.com/embed/DotnJ7tTA34',
    category: 'serie',
    year: 2022,
    duration: 60,
    rating: 8.5,
    featured: false,
    language: 'Inglés'
  },
  {
    id: '23',
    title: 'Wednesday',
    description: 'Wednesday Addams investiga una serie de asesinatos en su escuela.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg',
    videoUrl: 'https://www.youtube.com/embed/Di310WS8zLk',
    category: 'serie',
    year: 2022,
    duration: 45,
    rating: 8.3,
    featured: false,
    language: 'Inglés'
  },
  {
    id: '24',
    title: 'Stranger Things T4',
    description: 'Los amigos de Hawkins se enfrentan a su amenaza más peligrosa.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
    videoUrl: 'https://www.youtube.com/embed/yQEondeGvKo',
    category: 'serie',
    year: 2022,
    duration: 60,
    rating: 8.7,
    featured: false,
    language: 'Inglés'
  },
  {
    id: '25',
    title: 'The Bear',
    description: 'Un chef de alta cocina regresa a Chicago para dirigir el restaurante de su familia.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/sHFlbKS3WLqMnp9t2ghADIJFnuQ.jpg',
    videoUrl: 'https://www.youtube.com/embed/y-cqqAJIXhs',
    category: 'serie',
    year: 2022,
    duration: 30,
    rating: 8.6,
    featured: false,
    language: 'Inglés'
  },
  // MÁS PELÍCULAS
  {
    id: '26',
    title: 'Avatar: El Camino del Agua',
    description: 'Jake Sully y Neytiri forman una familia y protegen Pandora de una nueva amenaza.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
    videoUrl: 'https://www.youtube.com/embed/d9MyW72ELq0',
    category: 'ciencia-ficcion',
    year: 2022,
    duration: 192,
    rating: 7.9,
    featured: false,
    language: 'Español'
  },
  {
    id: '27',
    title: 'Interstellar',
    description: 'Un grupo de exploradores viaja a través de un agujero de gusano para salvar a la humanidad.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    videoUrl: 'https://www.youtube.com/embed/zSWdZVtXT7E',
    category: 'ciencia-ficcion',
    year: 2014,
    duration: 169,
    rating: 8.7,
    featured: false,
    language: 'Español'
  },
  {
    id: '28',
    title: 'Inception',
    description: 'Un ladrón que roba secretos a través del sueño es ofrecido una oportunidad de redención.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
    videoUrl: 'https://www.youtube.com/embed/YoHD9XEInc0',
    category: 'ciencia-ficcion',
    year: 2010,
    duration: 148,
    rating: 8.8,
    featured: false,
    language: 'Español'
  },
  {
    id: '29',
    title: 'Parasite',
    description: 'Una familia pobre idea un plan para infiltrarse en una familia rica.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
    videoUrl: 'https://www.youtube.com/embed/5xH0HfJHsaY',
    category: 'drama',
    year: 2019,
    duration: 132,
    rating: 8.6,
    featured: false,
    language: 'Coreano'
  },
  {
    id: '30',
    title: 'Joker',
    description: 'Arthur Fleck, un hombre con problemas mentales, se convierte en el icónico villano.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
    videoUrl: 'https://www.youtube.com/embed/zAGVQLHvwOY',
    category: 'drama',
    year: 2019,
    duration: 122,
    rating: 8.4,
    featured: false,
    language: 'Inglés'
  },
  {
    id: '31',
    title: 'Avengers: Endgame',
    description: 'Los Vengadores restantes se unen para revertir los actos de Thanos.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    videoUrl: 'https://www.youtube.com/embed/TcMBFSGVi1c',
    category: 'accion',
    year: 2019,
    duration: 181,
    rating: 8.4,
    featured: false,
    language: 'Español'
  },
  {
    id: '32',
    title: 'Spider-Man: No Way Home',
    description: 'Peter Parker pide ayuda a Doctor Strange para que olviden su identidad secreta.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
    videoUrl: 'https://www.youtube.com/embed/JfVOs4VSpmA',
    category: 'accion',
    year: 2021,
    duration: 148,
    rating: 8.4,
    featured: false,
    language: 'Español'
  },
  {
    id: '33',
    title: 'Get Out',
    description: 'Un hombre negro visita a la familia de su novia blanca y descubre un secreto aterrador.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg',
    videoUrl: 'https://www.youtube.com/embed/DzfpyUB60YY',
    category: 'terror',
    year: 2017,
    duration: 104,
    rating: 7.8,
    featured: false,
    language: 'Inglés'
  },
  {
    id: '34',
    title: 'Hereditary',
    description: 'Una familia descubre secretos aterradores sobre su linaje tras la muerte de su abuela.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/lHV8HHlhwNup2upbWsrCpC7ugjz.jpg',
    videoUrl: 'https://www.youtube.com/embed/V6wWNeijIyQ',
    category: 'terror',
    year: 2018,
    duration: 127,
    rating: 7.3,
    featured: false,
    language: 'Inglés'
  },
  {
    id: '35',
    title: 'La La Land',
    description: 'Un pianista y una actriz luchan por sus sueños en Los Ángeles.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg',
    videoUrl: 'https://www.youtube.com/embed/0pdqf4P9MPs',
    category: 'romance',
    year: 2016,
    duration: 128,
    rating: 8.0,
    featured: false,
    language: 'Inglés'
  },
  {
    id: '36',
    title: 'Crazy Rich Asians',
    description: 'Una profesora descubre que su novio es heredero de una fortuna en Singapur.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/5X7flwVvbsG4Fwcw7nvMcaZvbdM.jpg',
    videoUrl: 'https://www.youtube.com/embed/2Q6gLebYoLI',
    category: 'romance',
    year: 2018,
    duration: 120,
    rating: 7.0,
    featured: false,
    language: 'Inglés'
  },
  {
    id: '37',
    title: 'Super Mario Bros: La Película',
    description: 'Mario y Luigi viajan al Reino Champiñón para salvar a la Princesa Peach.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/qNBAXBIQlnOThrVvA6mA2B5ber9.jpg',
    videoUrl: 'https://www.youtube.com/embed/TnGl01FkMMo',
    category: 'animacion',
    year: 2023,
    duration: 92,
    rating: 7.5,
    featured: false,
    language: 'Español'
  },
  {
    id: '38',
    title: 'Elemental',
    description: 'En una ciudad donde los elementos de fuego, agua, tierra y aire viven juntos.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/4Y1WNkd88NIoGLuLr0KdBl24w6j.jpg',
    videoUrl: 'https://www.youtube.com/embed/hXzcyx9V0xw',
    category: 'animacion',
    year: 2023,
    duration: 101,
    rating: 7.3,
    featured: false,
    language: 'Español'
  },
  {
    id: '39',
    title: 'Encanto',
    description: 'Una familia colombiana con poderes mágicos vive en una casa encantada.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/4j0PNHkMr5ax3IA8tjtxcmPU3QT.jpg',
    videoUrl: 'https://www.youtube.com/embed/CaimKeDcudo',
    category: 'animacion',
    year: 2021,
    duration: 102,
    rating: 7.6,
    featured: false,
    language: 'Español'
  },
  {
    id: '40',
    title: 'Coco',
    description: 'Miguel viaja a la Tierra de los Muertos para encontrar a su tatarabuelo.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpg8qLbX31CS.jpg',
    videoUrl: 'https://www.youtube.com/embed/Rvr68u6k5sI',
    category: 'animacion',
    year: 2017,
    duration: 105,
    rating: 8.4,
    featured: false,
    language: 'Español'
  },
  // MÁS ANIME
  {
    id: '41',
    title: 'My Hero Academia: Two Heroes',
    description: 'Deku y All Might asisten a una exposición en una isla flotante.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/zSyer2NPv2GxYdXlVCGg6q5JCeT.jpg',
    videoUrl: 'https://www.youtube.com/embed/D5ddE8XGCd4',
    category: 'anime',
    year: 2018,
    duration: 96,
    rating: 7.8,
    featured: false,
    language: 'Japonés'
  },
  {
    id: '42',
    title: 'Weathering with You',
    description: 'Un chico conoce a una chica que puede controlar el clima.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/rUpXpqB1d6fL4M7GivwF_patRud.jpg',
    videoUrl: 'https://www.youtube.com/embed/Q6iKbMVPJuA',
    category: 'anime',
    year: 2019,
    duration: 112,
    rating: 8.1,
    featured: false,
    language: 'Japonés'
  },
  {
    id: '43',
    title: 'Princess Mononoke',
    description: 'Un príncipe se involucra en un conflicto entre los dioses del bosque y los humanos.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/jHWmNr7m544fJ8eItsfNk8fs2Ed.jpg',
    videoUrl: 'https://www.youtube.com/embed/4OiMOHRDs14',
    category: 'anime',
    year: 1997,
    duration: 134,
    rating: 8.6,
    featured: false,
    language: 'Japonés'
  },
  {
    id: '44',
    title: 'Howl\'s Moving Castle',
    description: 'Una joven es convertida en anciana por una bruja y busca la ayuda del mago Howl.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/52fX3vymPobxty4rSxITmpXoFqE.jpg',
    videoUrl: 'https://www.youtube.com/embed/iwROgK94zcM',
    category: 'anime',
    year: 2004,
    duration: 119,
    rating: 8.6,
    featured: false,
    language: 'Japonés'
  },
  {
    id: '45',
    title: 'A Silent Voice',
    description: 'Un ex-bully busca redención con una chica sorda que atormentó en el pasado.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/tQeJbvTTxJV1CqD4y9WBv2rn3Lb.jpg',
    videoUrl: 'https://www.youtube.com/embed/nfK6UgLra7g',
    category: 'anime',
    year: 2016,
    duration: 130,
    rating: 8.5,
    featured: false,
    language: 'Japonés'
  },
  // MÁS SERIES
  {
    id: '46',
    title: 'Breaking Bad',
    description: 'Un profesor de química con cáncer fabrica metanfetamina para asegurar el futuro de su familia.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    videoUrl: 'https://www.youtube.com/embed/HhesaQXLuRY',
    category: 'serie',
    year: 2008,
    duration: 47,
    rating: 9.5,
    featured: false,
    language: 'Inglés'
  },
  {
    id: '47',
    title: 'Game of Thrones',
    description: 'Nueve familias nobles luchan por el control de los Siete Reinos.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
    videoUrl: 'https://www.youtube.com/embed/KPLWWIOCOOQ',
    category: 'serie',
    year: 2011,
    duration: 60,
    rating: 9.3,
    featured: false,
    language: 'Inglés'
  },
  {
    id: '48',
    title: 'The Witcher',
    description: 'Geralt de Rivia, un cazador de monstruos, lucha por encontrar su lugar en el mundo.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg',
    videoUrl: 'https://www.youtube.com/embed/ndl1W4ltcmg',
    category: 'serie',
    year: 2019,
    duration: 60,
    rating: 8.2,
    featured: false,
    language: 'Inglés'
  },
  {
    id: '49',
    title: 'Money Heist',
    description: 'Un misterioso hombre conocido como El Profesor recluta a un grupo para el mayor robo de la historia.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg',
    videoUrl: 'https://www.youtube.com/embed/htgHfHo4nLo',
    category: 'serie',
    year: 2017,
    duration: 50,
    rating: 8.3,
    featured: false,
    language: 'Español'
  },
  {
    id: '50',
    title: 'Squid Game',
    description: 'Personas desesperadas aceptan jugar juegos infantiles con consecuencias mortales.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg',
    videoUrl: 'https://www.youtube.com/embed/oqxAJKy0ii4',
    category: 'serie',
    year: 2021,
    duration: 55,
    rating: 8.0,
    featured: false,
    language: 'Coreano'
  },
  {
    id: '51',
    title: 'Peaky Blinders',
    description: 'Una banda criminal en Birmingham después de la Primera Guerra Mundial.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg',
    videoUrl: 'https://www.youtube.com/embed/oVzVdvGIC7U',
    category: 'serie',
    year: 2013,
    duration: 60,
    rating: 8.8,
    featured: false,
    language: 'Inglés'
  },
  {
    id: '52',
    title: 'Dark',
    description: 'La desaparición de niños revela los secretos de cuatro familias en un pueblo alemán.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/apbrbWs8M9lyOpJYU5WXrpFbk1Z.jpg',
    videoUrl: 'https://www.youtube.com/embed/rrwycJ08PSA',
    category: 'serie',
    year: 2017,
    duration: 60,
    rating: 8.8,
    featured: false,
    language: 'Alemán'
  },
  // MÁS PELÍCULAS
  {
    id: '53',
    title: 'The Shawshank Redemption',
    description: 'Un banquero es sentenciado a cadena perpetua por un crimen que no cometió.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
    videoUrl: 'https://www.youtube.com/embed/6hB3S9bIaco',
    category: 'drama',
    year: 1994,
    duration: 142,
    rating: 9.3,
    featured: false,
    language: 'Inglés'
  },
  {
    id: '54',
    title: 'The Godfather',
    description: 'El patriarca de una familia mafiosa transfiere el control a su hijo menor.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    videoUrl: 'https://www.youtube.com/embed/sY1S34973zA',
    category: 'drama',
    year: 1972,
    duration: 175,
    rating: 9.2,
    featured: false,
    language: 'Inglés'
  },
  {
    id: '55',
    title: 'Pulp Fiction',
    description: 'Historias entrelazadas de criminales en Los Ángeles.',
    thumbnail: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
    videoUrl: 'https://www.youtube.com/embed/s7EdQ4FqbhY',
    category: 'drama',
    year: 1994,
    duration: 154,
    rating: 8.9,
    featured: false,
    language: 'Inglés'
  }
]

export const CATEGORIES = [
  { id: 'todas', name: 'Todas', icon: 'Grid' },
  { id: 'accion', name: 'Acción', icon: 'Zap' },
  { id: 'drama', name: 'Drama', icon: 'Film' },
  { id: 'comedia', name: 'Comedia', icon: 'Laugh' },
  { id: 'ciencia-ficcion', name: 'Ciencia Ficción', icon: 'Rocket' },
  { id: 'terror', name: 'Terror', icon: 'Ghost' },
  { id: 'romance', name: 'Romance', icon: 'Heart' },
  { id: 'animacion', name: 'Animación', icon: 'Sparkles' },
  { id: 'anime', name: 'Anime', icon: 'Star' },
  { id: 'serie', name: 'Series', icon: 'Globe' },
]
