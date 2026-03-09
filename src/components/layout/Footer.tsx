'use client'

import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#141414] py-12 px-4 md:px-12 mt-20">
      <div className="max-w-6xl mx-auto">
        {/* Social Links */}
        <div className="flex gap-4 mb-6">
          <a href="#" className="text-gray-400 hover:text-white transition">
            <Facebook className="w-6 h-6" />
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition">
            <Instagram className="w-6 h-6" />
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition">
            <Twitter className="w-6 h-6" />
          </a>
          <a href="#" className="text-gray-400 hover:text-white transition">
            <Youtube className="w-6 h-6" />
          </a>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="space-y-2">
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Audio y subtítulos</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Centro de ayuda</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Tarjetas regalo</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Centro de medios</a>
          </div>
          <div className="space-y-2">
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Inversores</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Empleo</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Términos de uso</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Privacidad</a>
          </div>
          <div className="space-y-2">
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Avisos legales</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Preferencias de cookies</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Información corporativa</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Contáctanos</a>
          </div>
          <div className="space-y-2">
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Preguntas frecuentes</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Cuenta</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Velocidad de reproducción</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Dispositivos compatibles</a>
          </div>
        </div>

        {/* Service Code Button */}
        <button className="border border-gray-600 text-gray-400 px-3 py-1 text-xs hover:text-white hover:border-gray-400 transition mb-6">
          Código de servicio
        </button>

        {/* Copyright */}
        <p className="text-gray-500 text-xs">
          © 2024 Vertiflix, Inc. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
