'use client'

import { useState, useEffect } from 'react'
import { Shield, LogOut, Film, Tag, Plus, Search, Edit, Trash2, X, Eye, EyeOff, Download, Loader2, CheckCircle, Link, AlertCircle, Settings, RefreshCw, Clock, Play, ExternalLink } from 'lucide-react'
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
  video_url?: string
  videoUrl?: string
  file_id?: string
  image_file_id?: string
  thumbnailFileId?: string
  category: string
  year: number
  duration: number
  rating: number
  language?: string
  added_by?: string
  addedAt?: string
  fileName?: string
  file_size?: number
  file_name?: string
  approved: boolean
  telegram_link?: string
  channel_message_id?: string
  channel_username?: string
  created_at?: { seconds?: number }
  image_url?: string
}

interface WebhookInfo {
  url: string
  has_custom_certificate: boolean
  pending_update_count: number
  last_error_date?: number
  last_error_message?: string
  max_connections?: number
}

export default function AdminPanel({ isOpen, onClose, movies, onAddMovie, onUpdateMovie, onDeleteMovie }: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('vf_admin_token')
      const expires = localStorage.getItem('vf_admin_expires')
      if (token && expires && parseInt(expires) > Date.now()) {
        return true
      }
    }
    return false
  })
  const [adminEmail, setAdminEmail] = useState<string>('')
  const [activeTab, setActiveTab] = useState<AdminTab>('telegram')
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Telegram states
  const [telegramMovies, setTelegramMovies] = useState<TelegramMovie[]>([])
  const [pendingMovies, setPendingMovies] = useState<TelegramMovie[]>([])
  const [isLoadingMovies, setIsLoadingMovies] = useState(false)
  const [webhookInfo, setWebhookInfo] = useState<WebhookInfo | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [isSettingWebhook, setIsSettingWebhook] = useState(false)
  const [webhookError, setWebhookError] = useState<string | null>(null)
  const [showPending, setShowPending] = useState(true)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      
      if (data.success) {
        localStorage.setItem('vf_admin_token', data.token)
        localStorage.setItem('vf_admin_expires', data.expiresAt.toString())
        setAdminEmail(data.admin.email)
        setIsAuthenticated(true)
        toast.success('¡Bienvenido!')
      } else {
        toast.error(data.error || 'Credenciales inválidas')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
    
    setIsLoading(false)
  }

  const handleLogout = async () => {
    const token = localStorage.getItem('vf_admin_token')
    
    try {
      await fetch('/api/auth/login', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
    } catch (error) {}
    
    localStorage.removeItem('vf_admin_token')
    localStorage.removeItem('vf_admin_expires')
    setAdminEmail('')
    setIsAuthenticated(false)
    toast.info('Sesión cerrada')
  }

  const loadWebhookInfo = async () => {
    try {
      const res = await fetch('/api/telegram/setup?password=admin123')
      const data = await res.json()
      if (data.ok && data.webhookInfo) {
        setWebhookInfo(data.webhookInfo)
        if (data.webhookInfo.url) {
          setWebhookUrl(data.webhookInfo.url)
        }
      }
    } catch (error) {
      console.error('Error loading webhook info:', error)
    }
  }

  const loadTelegramMovies = async () => {
    setIsLoadingMovies(true)
    try {
      // Load pending movies
      const pendingRes = await fetch('/api/telegram/movies?status=pending')
      const pendingData = await pendingRes.json()
      if (pendingData.ok) {
        setPendingMovies(pendingData.movies)
      }
      
      // Load approved movies
      const approvedRes = await fetch('/api/telegram/movies?status=approved')
      const approvedData = await approvedRes.json()
      if (approvedData.ok) {
        setTelegramMovies(approvedData.movies)
      }
    } catch (error) {
      console.error('Error loading movies:', error)
    }
    setIsLoadingMovies(false)
  }

  const approveMovie = async (movieId: string) => {
    try {
      const res = await fetch('/api/telegram/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', movieId, password: 'admin123' })
      })
      const data = await res.json()
      if (data.ok) {
        toast.success('Película aprobada')
        loadTelegramMovies()
      } else {
        toast.error('Error al aprobar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  const deleteMovie = async (movieId: string) => {
    if (!confirm('¿Eliminar esta película?')) return
    
    try {
      const res = await fetch(`/api/telegram/movies?id=${movieId}&password=admin123`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.ok) {
        toast.success('Película eliminada')
        loadTelegramMovies()
      } else {
        toast.error('Error al eliminar')
      }
    } catch (error) {
      toast.error('Error de conexión')
    }
  }

  const setWebhook = async () => {
    if (!webhookUrl) {
      toast.error('Ingresa la URL del webhook')
      return
    }
    setIsSettingWebhook(true)
    setWebhookError(null)
    try {
      const res = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, password: 'admin123' })
      })
      const data = await res.json()
      if (data.ok) {
        toast.success('Webhook configurado!')
        loadWebhookInfo()
      } else {
        setWebhookError(data.details || 'Error al configurar')
        toast.error('Error al configurar webhook')
      }
    } catch (error) {
      setWebhookError('Error de conexión')
      toast.error('Error de conexión')
    }
    setIsSettingWebhook(false)
  }

  // Cargar datos cuando se abre el tab de Telegram
  useEffect(() => {
    if (isAuthenticated && activeTab === 'telegram') {
      const timeout = setTimeout(() => {
        loadWebhookInfo()
        loadTelegramMovies()
      }, 0)
      return () => clearTimeout(timeout)
    }
  }, [isAuthenticated, activeTab])

  const handleFormSubmit = async (formData: FormData) => {
    const channelMessageIdValue = formData.get('channelMessageId') as string
    
    const movieData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      thumbnail: formData.get('thumbnail') as string,
      videoUrl: formData.get('videoUrl') as string || null,
      category: formData.get('category') as string,
      year: parseInt(formData.get('year') as string),
      duration: parseInt(formData.get('duration') as string),
      rating: parseFloat(formData.get('rating') as string) || 0,
      featured: formData.get('featured') === 'true',
      language: formData.get('language') as string,
      // Telegram MTProto fields
      channelUsername: formData.get('channelUsername') as string || null,
      channelMessageId: channelMessageIdValue ? parseInt(channelMessageIdValue) : null,
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
                <div className="text-3xl font-black text-yellow-500">{pendingMovies.length}</div>
                <div className="text-white/50 text-xs uppercase">Pendientes</div>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-black text-green-500">{telegramMovies.length}</div>
                <div className="text-white/50 text-xs uppercase">Aprobadas</div>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-black text-[#E50914]">{new Set(movies.map(m => m.category)).size}</div>
                <div className="text-white/50 text-xs uppercase">Categorías</div>
              </div>
            </div>

            <div className="flex gap-1 bg-[#1a1a1a] p-1 rounded-lg mb-6 overflow-x-auto">
              {[
                { id: 'telegram', icon: Download, label: 'Telegram', badge: pendingMovies.length },
                { id: 'add', icon: Plus, label: 'Agregar' },
                { id: 'list', icon: Film, label: 'Catálogo' },
                { id: 'categories', icon: Tag, label: 'Categorías' },
              ].map(tab => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id as AdminTab); setEditingMovie(null) }}
                  className={cn('flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm transition-colors whitespace-nowrap relative',
                    activeTab === tab.id ? 'bg-[#E50914] text-white font-semibold' : 'text-white/60 hover:text-white hover:bg-white/10')}>
                  <tab.icon className="w-4 h-4" /> {tab.label}
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
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

                {/* Webhook Configuration */}
                <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Webhook
                    </h4>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={loadWebhookInfo}
                      disabled={isSettingWebhook}
                    >
                      <RefreshCw className={cn('w-4 h-4 mr-1', isSettingWebhook && 'animate-spin')} /> Verificar
                    </Button>
                  </div>
                  
                  {webhookInfo && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        {webhookInfo.url ? (
                          <span className="flex items-center gap-1 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" /> Activo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-400 text-sm">
                            <AlertCircle className="w-4 h-4" /> Sin configurar
                          </span>
                        )}
                      </div>
                      {webhookInfo.url && (
                        <div className="text-xs text-white/50 break-all">{webhookInfo.url}</div>
                      )}
                      {webhookInfo.last_error_message && (
                        <div className="text-xs text-red-400 bg-red-400/10 p-2 rounded">
                          {webhookInfo.last_error_message}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input 
                      value={webhookUrl} 
                      onChange={e => setWebhookUrl(e.target.value)}
                      placeholder="https://tu-dominio.com/api/telegram/webhook"
                      className="bg-[#141414] border-white/20 text-sm"
                    />
                    <Button 
                      onClick={setWebhook} 
                      disabled={isSettingWebhook || !webhookUrl}
                      size="sm"
                      className="bg-[#0088cc] hover:bg-[#0077bb]"
                    >
                      {isSettingWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Tabs for pending/approved */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowPending(true)}
                    className={cn(
                      'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition',
                      showPending 
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' 
                        : 'bg-[#1a1a1a] text-white/60 border border-white/10'
                    )}
                  >
                    <Clock className="w-4 h-4 inline mr-2" />
                    Pendientes ({pendingMovies.length})
                  </button>
                  <button
                    onClick={() => setShowPending(false)}
                    className={cn(
                      'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition',
                      !showPending 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                        : 'bg-[#1a1a1a] text-white/60 border border-white/10'
                    )}
                  >
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Aprobadas ({telegramMovies.length})
                  </button>
                </div>

                {/* Movies List */}
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">
                    {showPending ? '⏳ Pendientes de aprobación' : '✅ Películas aprobadas'}
                  </h4>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={loadTelegramMovies}
                    disabled={isLoadingMovies}
                  >
                    {isLoadingMovies ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                    Actualizar
                  </Button>
                </div>

                {(showPending ? pendingMovies : telegramMovies).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(showPending ? pendingMovies : telegramMovies).map(movie => {
                      // Usar proxy para imágenes de Telegram si tenemos el file_id
                      const imageSrc = movie.image_file_id
                        ? `/api/telegram/image?file_id=${movie.image_file_id}`
                        : movie.thumbnail || 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg'

                      return (
                      <div key={movie.id} className="bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden">
                        <div className="flex gap-3 p-3">
                          <img
                            src={imageSrc}
                            alt={movie.title}
                            className="w-24 h-36 object-cover rounded"
                            onError={e => { (e.target as HTMLImageElement).src = 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg' }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white truncate">{movie.title}</h4>
                            <p className="text-white/50 text-sm">{movie.category} • {movie.year}</p>
                            <p className="text-white/40 text-xs mt-1">
                              {movie.file_size ? `${(movie.file_size / 1024 / 1024).toFixed(0)} MB` : 'N/A'} • {movie.duration} min
                            </p>
                            {movie.added_by && (
                              <p className="text-white/40 text-xs">Por: {movie.added_by}</p>
                            )}
                            {movie.telegram_link && (
                              <a 
                                href={movie.telegram_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[#0088cc] text-xs mt-1 hover:underline"
                              >
                                <ExternalLink className="w-3 h-3" /> Ver en Telegram
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 p-3 pt-0 border-t border-white/5">
                          {showPending ? (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => approveMovie(movie.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Aprobar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => deleteMovie(movie.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1 border-white/20"
                                onClick={() => window.open(movie.telegram_link, '_blank')}
                              >
                                <Play className="w-4 h-4 mr-1" /> Ver
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => deleteMovie(movie.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-white/50">
                    <Film className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{showPending ? 'No hay películas pendientes' : 'No hay películas aprobadas'}</p>
                    <p className="text-sm mt-1">
                      {showPending ? 'Las películas enviadas al bot aparecerán aquí' : 'Aprueba películas pendientes para verlas aquí'}
                    </p>
                  </div>
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
