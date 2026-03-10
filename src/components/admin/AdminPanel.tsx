'use client'

import { useState } from 'react'
import { Shield, LogOut, Film, Tag, Plus, Search, Edit, Trash2, X, Eye, EyeOff, Download, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Movie, CATEGORIES } from '@/types'
import MovieForm from './MovieForm'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AdminPanelProps {
  isOpen: boolean
  onClose: () => void
  movies: Movie[]
  onAddMovie: (movie: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  onUpdateMovie: (id: string, movie: Partial<Movie>) => Promise<void>
  onDeleteMovie: (id: string) => Promise<void>
}

type AdminTab = 'add' | 'list' | 'categories' | 'telegram'

interface TelegramMovie {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl: string
  category: string
  year: number
  duration: number
  rating: number
  selected?: boolean
}

export default function AdminPanel({ isOpen, onClose, movies, onAddMovie, onUpdateMovie, onDeleteMovie }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('vf_admin_auth') === 'true'
    return false
  })
  const [activeTab, setActiveTab] = useState<AdminTab>('add')
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Telegram states
  const [telegramUrl, setTelegramUrl] = useState('')
  const [telegramLimit, setTelegramLimit] = useState(10)
  const [telegramMovies, setTelegramMovies] = useState<TelegramMovie[]>([])
  const [isScraping, setIsScraping] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    if (email && password.length >= 6) {
      localStorage.setItem('vf_admin_auth', 'true')
      setIsAuthenticated(true)
      toast.success('¡Bienvenido!')
    } else {
      toast.error('Credenciales inválidas')
    }
    setIsLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('vf_admin_auth')
    setIsAuthenticated(false)
    toast.info('Sesión cerrada')
  }

  const handleFormSubmit = async (formData: FormData) => {
    const movieData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      thumbnail: formData.get('thumbnail') as string,
      videoUrl: formData.get('videoUrl') as string,
      category: formData.get('category') as string,
      year: parseInt(formData.get('year') as string),
      duration: parseInt(formData.get('duration') as string),
      rating: parseFloat(formData.get('rating') as string) || 0,
      featured: formData.get('featured') === 'true',
      language: formData.get('language') as string,
    }
    try {
      if (editingMovie) {
        await onUpdateMovie(editingMovie.id, movieData)
        toast.success('Película actualizada')
        setEditingMovie(null)
      } else {
        await onAddMovie(movieData)
        toast.success('Película agregada')
      }
      setActiveTab('list')
    } catch {
      toast.error('Error al guardar')
    }
  }

  // Telegram scraping
  const handleScrapeTelegram = async () => {
    if (!telegramUrl) {
      toast.error('Ingresa una URL de canal')
      return
    }
    setIsScraping(true)
    try {
      const res = await fetch('/api/telegram/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelUrl: telegramUrl, limit: telegramLimit, adminPassword: 'admin123' })
      })
      const data = await res.json()
      if (data.success) {
        setTelegramMovies(data.movies.map((m: TelegramMovie) => ({ ...m, selected: true })))
        toast.success(`${data.movies.length} películas encontradas`)
      } else {
        toast.error(data.error || 'Error al scrapear')
      }
    } catch {
      toast.error('Error de conexión')
    }
    setIsScraping(false)
  }

  const toggleMovieSelection = (id: string) => {
    setTelegramMovies(prev => prev.map(m => m.id === id ? { ...m, selected: !m.selected } : m))
  }

  const selectAll = () => setTelegramMovies(prev => prev.map(m => ({ ...m, selected: true })))
  const deselectAll = () => setTelegramMovies(prev => prev.map(m => ({ ...m, selected: false })))

  const importSelected = async () => {
    const selected = telegramMovies.filter(m => m.selected)
    if (selected.length === 0) {
      toast.error('Selecciona al menos una película')
      return
    }
    setIsImporting(true)
    let imported = 0
    for (const movie of selected) {
      try {
        await onAddMovie({
          title: movie.title,
          description: movie.description,
          thumbnail: movie.thumbnail,
          videoUrl: movie.videoUrl,
          category: movie.category || 'otros',
          year: movie.year || 2024,
          duration: movie.duration || 120,
          rating: movie.rating || 7.0,
          featured: false,
          language: 'Español'
        })
        imported++
      } catch { }
    }
    toast.success(`${imported} películas importadas`)
    setTelegramMovies([])
    setActiveTab('list')
    setIsImporting(false)
  }

  const filteredMovies = movies.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.category.toLowerCase().includes(searchQuery.toLowerCase()))
  const categoryStats = CATEGORIES.filter(c => c.id !== 'todas').map(cat => ({ ...cat, count: movies.filter(m => m.category === cat.id).length }))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[90] bg-[#0a0a0a] overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button variant="ghost" size="icon" onClick={onClose} className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20">
          <X className="w-5 h-5" />
        </Button>

        {!isAuthenticated ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-[#E50914] tracking-wider uppercase">VERTIFLIX</h1>
              <p className="text-white/50 text-sm mt-1">Panel de Administración</p>
            </div>
            <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-6">Iniciar Sesión</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-xs uppercase tracking-wider mb-2">Email</label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ejemplo.com" required className="bg-[#141414] border-white/20" />
                </div>
                <div className="relative">
                  <label className="block text-white/80 text-xs uppercase tracking-wider mb-2">Contraseña</label>
                  <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="bg-[#141414] border-white/20 pr-10" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-7 text-white/50">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-[#E50914] hover:bg-[#b00710]">
                  {isLoading ? 'Ingresando...' : 'Ingresar'}
                </Button>
              </form>
              <p className="text-center text-white/50 text-xs mt-4">Demo: cualquier email + 6 caracteres</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#E50914]" />
                <h1 className="text-2xl font-bold">Panel Admin</h1>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-white/20">
                <LogOut className="w-4 h-4 mr-2" /> Salir
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-black text-[#E50914]">{movies.length}</div>
                <div className="text-white/50 text-xs uppercase">Películas</div>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-black text-[#E50914]">{new Set(movies.map(m => m.category)).size}</div>
                <div className="text-white/50 text-xs uppercase">Categorías</div>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-black text-[#E50914]">{movies.length > 0 ? (movies.reduce((a, m) => a + m.rating, 0) / movies.length).toFixed(1) : '0.0'}</div>
                <div className="text-white/50 text-xs uppercase">Rating</div>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-black text-[#E50914]">{movies.filter(m => m.featured).length}</div>
                <div className="text-white/50 text-xs uppercase">Destacados</div>
              </div>
            </div>

            <div className="flex gap-1 bg-[#1a1a1a] p-1 rounded-lg mb-6 overflow-x-auto">
              {[
                { id: 'add', icon: Plus, label: 'Agregar' },
                { id: 'telegram', icon: Download, label: 'Telegram' },
                { id: 'list', icon: Film, label: 'Catálogo' },
                { id: 'categories', icon: Tag, label: 'Categorías' },
              ].map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id as AdminTab); setEditingMovie(null) }}
                  className={cn('flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm transition-colors whitespace-nowrap',
                    activeTab === tab.id ? 'bg-[#E50914] text-white font-semibold' : 'text-white/60 hover:text-white hover:bg-white/10')}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'add' && <MovieForm movie={editingMovie} onSubmit={handleFormSubmit} onCancel={() => setEditingMovie(null)} isEditing={!!editingMovie} />}

            {activeTab === 'telegram' && (
              <div className="space-y-6">
                {/* Bot Info */}
                <div className="bg-gradient-to-r from-[#0088cc]/20 to-transparent border border-[#0088cc]/30 rounded-lg p-4">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.121.099.154.232.17.324.015.093.034.306.019.472z"/>
                    </svg>
                    @VertiflixBot
                  </h3>
                  <p className="text-white/70 text-sm mb-3">
                    Envía películas y videos directamente al bot para agregarlas a Vertiflix.
                  </p>
                  <a 
                    href="https://t.me/VertiflixBot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#0088cc] hover:bg-[#0077bb] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    Abrir Bot en Telegram
                  </a>
                </div>

                {/* Instructions */}
                <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">📱 Cómo agregar películas:</h4>
                  <ol className="text-white/70 text-sm space-y-2 list-decimal list-inside">
                    <li>Abre <span className="text-[#0088cc]">@VertiflixBot</span> en Telegram</li>
                    <li>Envía <code className="bg-white/10 px-1 rounded">/start</code> para comenzar</li>
                    <li>Reenvía o sube un video al bot</li>
                    <li>Escribe el título como descripción del video</li>
                    <li>La película aparecerá aquí automáticamente</li>
                  </ol>
                </div>

                {/* Movies from Bot */}
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Películas recibidas vía Bot:</h4>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={async () => {
                      setIsScraping(true)
                      try {
                        const res = await fetch('/api/telegram/webhook?password=admin123')
                        const data = await res.json()
                        if (data.movies && data.movies.length > 0) {
                          setTelegramMovies(data.movies.map((m: TelegramMovie) => ({ ...m, selected: true })))
                          toast.success(`${data.movies.length} películas encontradas`)
                        } else {
                          toast.info('No hay películas nuevas. Envía videos al bot primero.')
                        }
                      } catch {
                        toast.error('Error al cargar')
                      }
                      setIsScraping(false)
                    }}
                    disabled={isScraping}
                  >
                    {isScraping ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Actualizar
                  </Button>
                </div>

                {telegramMovies.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">{telegramMovies.filter(m => m.selected).length} seleccionadas</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={selectAll} className="text-xs">Todas</Button>
                        <Button size="sm" variant="outline" onClick={deselectAll} className="text-xs">Ninguna</Button>
                        <Button size="sm" onClick={importSelected} disabled={isImporting} className="bg-green-600 hover:bg-green-700">
                          {isImporting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />} Importar
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {telegramMovies.map(movie => (
                        <div key={movie.id} onClick={() => toggleMovieSelection(movie.id)}
                          className={cn('relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all', movie.selected ? 'border-[#E50914] ring-2 ring-[#E50914]/50' : 'border-white/10 opacity-60')}>
                          <img src={movie.thumbnail} alt={movie.title} className="w-full aspect-[2/3] object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-2">
                            <p className="text-white text-sm font-medium truncate">{movie.title}</p>
                            <p className="text-white/50 text-xs">{movie.year}</p>
                          </div>
                          {movie.selected && <div className="absolute top-2 right-2 w-6 h-6 bg-[#E50914] rounded-full flex items-center justify-center"><CheckCircle className="w-4 h-4 text-white" /></div>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'list' && (
              <div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar..." className="pl-10 bg-[#1a1a1a] border-white/20" />
                </div>
                <div className="space-y-3">
                  {filteredMovies.map(movie => (
                    <div key={movie.id} className="flex items-center gap-4 p-4 bg-[#1a1a1a] border border-white/10 rounded-lg">
                      <img src={movie.thumbnail} alt={movie.title} className="w-16 h-24 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate">{movie.title}</h3>
                        <p className="text-white/50 text-sm">{movie.category} • {movie.year} • ⭐ {movie.rating}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditingMovie(movie); setActiveTab('add') }} className="border-white/20"><Edit className="w-4 h-4" /></Button>
                        <Button variant="destructive" size="sm" onClick={() => { if (confirm('¿Eliminar?')) onDeleteMovie(movie.id) }}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categoryStats.map(cat => (
                  <div key={cat.id} className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-center hover:border-[#E50914]/50 transition cursor-pointer">
                    <div className="text-2xl font-black text-[#E50914]">{cat.count}</div>
                    <div className="text-white/70 text-sm">{cat.name}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
