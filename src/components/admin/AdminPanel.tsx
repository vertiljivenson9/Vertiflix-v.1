'use client';

import { useState } from 'react';
import { Shield, LogOut, Film, Tag, Plus, Search, Edit, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Movie, CATEGORIES } from '@/types';
import MovieForm from './MovieForm';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  movies: Movie[];
  onAddMovie: (movie: Omit<Movie, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateMovie: (id: string, movie: Partial<Movie>) => Promise<void>;
  onDeleteMovie: (id: string) => Promise<void>;
}

type AdminTab = 'add' | 'list' | 'categories';
type AuthView = 'login' | 'register' | 'management';

export default function AdminPanel({
  isOpen,
  onClose,
  movies,
  onAddMovie,
  onUpdateMovie,
  onDeleteMovie,
}: AdminPanelProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Check localStorage on initial render
    if (typeof window !== 'undefined') {
      const auth = localStorage.getItem('vf_admin_auth') === 'true';
      return auth;
    }
    return false;
  });
  
  // Set initial view based on auth
  const [authView, setAuthView] = useState<AuthView>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('vf_admin_auth') === 'true') {
      return 'management';
    }
    return 'login';
  });
  
  const [activeTab, setActiveTab] = useState<AdminTab>('add');
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Demo: accept any email/password for demo
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (email && password.length >= 6) {
      localStorage.setItem('vf_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthView('management');
      toast.success('¡Bienvenido al panel admin!');
    } else {
      toast.error('Credenciales inválidas. La contraseña debe tener al menos 6 caracteres.');
    }
    setIsLoading(false);
  };

  // Handle register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (email && password.length >= 6) {
      localStorage.setItem('vf_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthView('management');
      toast.success('Cuenta creada correctamente');
    } else {
      toast.error('La contraseña debe tener al menos 6 caracteres.');
    }
    setIsLoading(false);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('vf_admin_auth');
    setIsAuthenticated(false);
    setAuthView('login');
    toast.info('Sesión cerrada');
  };

  // Handle form submit
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
    };

    try {
      if (editingMovie) {
        await onUpdateMovie(editingMovie.id, movieData);
        toast.success('Película actualizada');
        setEditingMovie(null);
      } else {
        await onAddMovie(movieData);
        toast.success('Película agregada');
      }
      setActiveTab('list');
    } catch {
      toast.error('Error al guardar la película');
    }
  };

  // Filter movies
  const filteredMovies = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get category stats
  const categoryStats = CATEGORIES.filter((c) => c.id !== 'todas').map((cat) => ({
    ...cat,
    count: movies.filter((m) => m.category === cat.id).length,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-[#0a0a0a] overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Auth Views */}
        {!isAuthenticated && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center">
            {/* Logo */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-[#E50914] tracking-wider uppercase">
                VERTIFLIX
              </h1>
              <p className="text-white/50 text-sm mt-1">Panel de Administración</p>
            </div>

            {/* Login Form */}
            {authView === 'login' && (
              <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-1">Iniciar Sesión</h2>
                <p className="text-white/50 text-sm mb-6">Accede a tu panel de control</p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-xs uppercase tracking-wider mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@ejemplo.com"
                      required
                      className="bg-[#141414] border-white/20 focus:border-[#E50914]"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-white/80 text-xs uppercase tracking-wider mb-2">
                      Contraseña
                    </label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="bg-[#141414] border-white/20 focus:border-[#E50914] pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-7 text-white/50 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#E50914] hover:bg-[#b00710]"
                  >
                    {isLoading ? 'Ingresando...' : 'Ingresar'}
                  </Button>
                </form>

                <p className="text-center text-white/50 text-sm mt-6">
                  ¿Primera vez?{' '}
                  <button
                    onClick={() => setAuthView('register')}
                    className="text-[#E50914] font-semibold hover:underline"
                  >
                    Crear cuenta admin
                  </button>
                </p>
              </div>
            )}

            {/* Register Form */}
            {authView === 'register' && (
              <div className="w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-1">Registrar Admin</h2>
                <p className="text-white/50 text-sm mb-6">Crea tu cuenta de administrador</p>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-white/80 text-xs uppercase tracking-wider mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@ejemplo.com"
                      required
                      className="bg-[#141414] border-white/20 focus:border-[#E50914]"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-white/80 text-xs uppercase tracking-wider mb-2">
                      Contraseña
                    </label>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      className="bg-[#141414] border-white/20 focus:border-[#E50914] pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-7 text-white/50 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#E50914] hover:bg-[#b00710]"
                  >
                    {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                </form>

                <p className="text-center text-white/50 text-sm mt-6">
                  ¿Ya tienes cuenta?{' '}
                  <button
                    onClick={() => setAuthView('login')}
                    className="text-[#E50914] font-semibold hover:underline"
                  >
                    Iniciar sesión
                  </button>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Management Panel */}
        {isAuthenticated && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#E50914]" />
                <h1 className="text-2xl font-bold">Panel Admin</h1>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-white/20 hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Salir
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-black text-[#E50914]">{movies.length}</div>
                <div className="text-white/50 text-xs uppercase tracking-wider">Películas</div>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-black text-[#E50914]">
                  {new Set(movies.map((m) => m.category)).size}
                </div>
                <div className="text-white/50 text-xs uppercase tracking-wider">Categorías</div>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-black text-[#E50914]">
                  {movies.length > 0
                    ? (
                        movies.reduce((acc, m) => acc + m.rating, 0) / movies.length
                      ).toFixed(1)
                    : '0.0'}
                </div>
                <div className="text-white/50 text-xs uppercase tracking-wider">Rating Prom.</div>
              </div>
              <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-center">
                <div className="text-3xl font-black text-[#E50914]">
                  {movies.filter((m) => m.featured).length}
                </div>
                <div className="text-white/50 text-xs uppercase tracking-wider">Destacados</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-[#1a1a1a] p-1 rounded-lg mb-6">
              <button
                onClick={() => {
                  setActiveTab('add');
                  setEditingMovie(null);
                }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm transition-colors',
                  activeTab === 'add'
                    ? 'bg-[#E50914] text-white font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm transition-colors',
                  activeTab === 'list'
                    ? 'bg-[#E50914] text-white font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                <Film className="w-4 h-4" />
                Catálogo
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm transition-colors',
                  activeTab === 'categories'
                    ? 'bg-[#E50914] text-white font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                )}
              >
                <Tag className="w-4 h-4" />
                Categorías
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'add' && (
              <MovieForm
                movie={editingMovie}
                onSubmit={handleFormSubmit}
                onCancel={() => setEditingMovie(null)}
                isEditing={!!editingMovie}
              />
            )}

            {activeTab === 'list' && (
              <div>
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar película..."
                    className="pl-10 bg-[#1a1a1a] border-white/20 focus:border-[#E50914]"
                  />
                </div>

                {/* Movies List */}
                <div className="space-y-3">
                  {filteredMovies.map((movie) => (
                    <div
                      key={movie.id}
                      className="flex items-center gap-4 p-4 bg-[#1a1a1a] border border-white/10 rounded-lg"
                    >
                      <img
                        src={movie.thumbnail}
                        alt={movie.title}
                        className="w-16 h-24 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate">{movie.title}</h3>
                        <p className="text-white/50 text-sm">
                          {movie.category} • {movie.year} • {movie.duration} min
                          {movie.rating > 0 && ` • ⭐ ${movie.rating}`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingMovie(movie);
                            setActiveTab('add');
                          }}
                          className="border-white/20 hover:bg-white/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`¿Eliminar "${movie.title}"?`)) {
                              onDeleteMovie(movie.id);
                              toast.success('Película eliminada');
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredMovies.length === 0 && (
                    <div className="text-center py-12 text-white/50">
                      <Film className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No se encontraron películas</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categoryStats.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 text-center hover:border-[#E50914]/50 transition-colors cursor-pointer"
                  >
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
  );
}
