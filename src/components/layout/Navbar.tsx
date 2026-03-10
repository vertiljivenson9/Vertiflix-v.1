'use client'

import { useState, useEffect } from 'react'
import { Search, Heart, User, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface NavbarProps {
  onSearch?: (query: string) => void
  onFavoritesClick?: () => void
  onAdminClick?: () => void
}

export default function Navbar({ onSearch, onFavoritesClick, onAdminClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    onSearch?.(e.target.value)
  }

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-4 md:px-12 py-4',
        scrolled
          ? 'bg-black/95 backdrop-blur-md shadow-lg'
          : 'bg-gradient-to-b from-black/80 to-transparent'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <a href="#" className="flex items-center gap-1">
            <span className="text-red-600 font-black text-2xl md:text-3xl tracking-wider">
              VERTIFLIX
            </span>
          </a>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#" className="text-white font-medium hover:text-gray-300 transition">Inicio</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Series</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Películas</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Novedades</a>
            <a href="#" className="text-gray-400 hover:text-white transition">Mi lista</a>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden sm:flex items-center">
            {searchOpen ? (
              <div className="relative animate-in slide-in-from-right-4 duration-300">
                <Input
                  type="text"
                  placeholder="Títulos, personas, géneros"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="bg-black/80 border-gray-700 text-white w-64 pl-10 focus:border-white"
                  autoFocus
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <button
                  onClick={() => {
                    setSearchOpen(false)
                    setSearchQuery('')
                    onSearch?.('')
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="text-white hover:text-gray-300 transition p-2"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Favorites */}
          <button
            onClick={onFavoritesClick}
            className="text-white hover:text-red-500 transition p-2"
          >
            <Heart className="w-5 h-5" />
          </button>

          {/* User Avatar */}
          <button className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t border-gray-800 pt-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-4">
            {/* Mobile Search */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={handleSearch}
                className="bg-gray-900 border-gray-700 text-white pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <a href="#" className="text-white font-medium py-2">Inicio</a>
            <a href="#" className="text-gray-400 hover:text-white py-2">Series</a>
            <a href="#" className="text-gray-400 hover:text-white py-2">Películas</a>
            <a href="#" className="text-gray-400 hover:text-white py-2">Novedades</a>
            <a href="#" className="text-gray-400 hover:text-white py-2">Mi lista</a>
          </div>
        </div>
      )}
    </nav>
  )
}
