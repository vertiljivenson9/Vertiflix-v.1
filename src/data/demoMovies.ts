import { Movie } from '@/types';

export const demoMovies: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: "Dune: Parte Dos",
    description: "Paul Atreides se une a los Fremen mientras busca venganza contra los conspiradores que destruyeron a su familia. Enfrentando una elección entre el amor de su vida y el destino del universo, debe esforzarse por evitar un futuro terrible que solo él puede predecir.",
    thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=600&fit=crop",
    videoUrl: "https://drive.google.com/file/d/example1/preview",
    category: "ciencia ficción",
    year: 2024,
    duration: 166,
    rating: 8.8,
    featured: true,
    language: "Español"
  },
  {
    title: "Oppenheimer",
    description: "La historia del físico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica durante la Segunda Guerra Mundial. Una mirada profunda al precio del genio y las consecuencias de sus acciones.",
    thumbnail: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop",
    videoUrl: "https://drive.google.com/file/d/example2/preview",
    category: "drama",
    year: 2023,
    duration: 180,
    rating: 8.9,
    featured: true,
    language: "Inglés"
  },
  {
    title: "John Wick 4",
    description: "John Wick descubre un camino para derrotar a la Alta Mesa, pero antes de ganar su libertad, debe enfrentarse a un nuevo enemigo con poderosas alianzas en todo el mundo.",
    thumbnail: "https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop",
    videoUrl: "https://drive.google.com/file/d/example3/preview",
    category: "acción",
    year: 2023,
    duration: 169,
    rating: 8.5,
    featured: true,
    language: "Inglés"
  },
  {
    title: "Poor Things",
    description: "Bella Baxter es una joven resucitada por el brillante científico Dr. Godwin Baxter. Bajo su protección, Bella decide correr el mundo y descubrir las maravillas que este le ofrece.",
    thumbnail: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=600&fit=crop",
    videoUrl: "https://drive.google.com/file/d/example4/preview",
    category: "comedia",
    year: 2023,
    duration: 141,
    rating: 8.2,
    featured: false,
    language: "Inglés"
  },
  {
    title: "El Exorcista: Creyente",
    description: "Dos niñas desaparecen en el bosque y regresan tres días después sin recordar nada. Pronto, sus familias deben enfrentar una fuerza maligna que exige un sacrificio terrible.",
    thumbnail: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop",
    videoUrl: "https://drive.google.com/file/d/example5/preview",
    category: "terror",
    year: 2023,
    duration: 111,
    rating: 6.2,
    featured: false,
    language: "Español"
  },
  {
    title: "Anyone But You",
    description: "Tras una primera cita increíble, Bea y Ben se separan por un malentendido. Cuando se reencuentran en una boda en Australia, fingir ser pareja se convierte en algo más complicado de lo que esperaban.",
    thumbnail: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&h=600&fit=crop",
    videoUrl: "https://drive.google.com/file/d/example6/preview",
    category: "romance",
    year: 2023,
    duration: 104,
    rating: 6.8,
    featured: false,
    language: "Español"
  },
  {
    title: "Indiana Jones y el Dial del Destino",
    description: "El legendario Indiana Jones regresa en una nueva aventura para recuperar un artefacto que podría cambiar el curso de la historia. Perseguido por nazis y con la ayuda de su ahijada, Indy enfrenta su mayor desafío.",
    thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop",
    videoUrl: "https://drive.google.com/file/d/example7/preview",
    category: "aventura",
    year: 2023,
    duration: 154,
    rating: 7.1,
    featured: false,
    language: "Español"
  },
  {
    title: "Spider-Man: Cruzando el Multiverso",
    description: "Miles Morales regresa para la próxima aventura de la saga Spider-Verse. Cuando se une a Gwen Stacy y un nuevo equipo de Spider-People, se enfrenta a un villano más poderoso que cualquier cosa que hayan visto.",
    thumbnail: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&h=600&fit=crop",
    videoUrl: "https://drive.google.com/file/d/example8/preview",
    category: "animación",
    year: 2023,
    duration: 140,
    rating: 8.7,
    featured: true,
    language: "Español"
  },
  {
    title: "Planet Earth III",
    description: "Una mirada impresionante a la naturaleza y la vida salvaje en todo el planeta. Descubre los hábitats más remotos y las criaturas más fascinantes en esta producción de la BBC.",
    thumbnail: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=600&fit=crop",
    videoUrl: "https://drive.google.com/file/d/example9/preview",
    category: "documental",
    year: 2023,
    duration: 360,
    rating: 9.2,
    featured: false,
    language: "Español"
  },
  {
    title: "Napoleón",
    description: "Un retrato personal de los orígenes de Napoleón Bonaparte y su rápido ascenso al poder, visto a través de la lente de su relación adictiva y volátil con su esposa Josefina.",
    thumbnail: "https://images.unsplash.com/photo-1547499417-61a7b5e66d04?w=400&h=600&fit=crop",
    videoUrl: "https://drive.google.com/file/d/example10/preview",
    category: "drama",
    year: 2023,
    duration: 158,
    rating: 7.4,
    featured: false,
    language: "Inglés"
  },
  {
    title: "Godzilla x Kong: El Nuevo Imperio",
    description: "Dos titanes ancestrales, Godzilla y Kong, se enfrentan en una batalla épica mientras los humanos desenterran un misterio que conecta los orígenes de estas criaturas con Skull Island.",
    thumbnail: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=400&h=600&fit=crop",
    videoUrl: "https://drive.google.com/file/d/example11/preview",
    category: "acción",
    year: 2024,
    duration: 115,
    rating: 7.0,
    featured: true,
    language: "Español"
  },
  {
    title: "Saltburn",
    description: "Un estudiante de Oxford se obsessiona con un compañero de clase carismático y es invitado a pasar el verano en la mansión familiar de su excéntrica familia.",
    thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop",
    videoUrl: "https://drive.google.com/file/d/example12/preview",
    category: "drama",
    year: 2023,
    duration: 131,
    rating: 7.6,
    featured: false,
    language: "Inglés"
  }
];
