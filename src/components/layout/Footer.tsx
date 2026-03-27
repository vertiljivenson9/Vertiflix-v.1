'use client'

import { Facebook, Instagram, Twitter, Youtube, Mail, Heart, Shield, Scale, GraduationCap } from 'lucide-react'
import { useState } from 'react'

export default function Footer() {
  const [showTerms, setShowTerms] = useState(false)

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
            <button 
              onClick={() => setShowTerms(true)}
              className="block text-gray-400 hover:text-gray-200 text-sm"
            >
              Términos de uso
            </button>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Privacidad</a>
          </div>
          <div className="space-y-2">
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Avisos legales</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Preferencias de cookies</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Información corporativa</a>
            <a href={`mailto:Vertiljivenson9@gmail.com`} className="block text-gray-400 hover:text-gray-200 text-sm">
              Contáctanos
            </a>
          </div>
          <div className="space-y-2">
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Preguntas frecuentes</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Cuenta</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Velocidad de reproducción</a>
            <a href="#" className="block text-gray-400 hover:text-gray-200 text-sm">Dispositivos compatibles</a>
          </div>
        </div>

        {/* Support Button */}
        <a 
          href={`mailto:Vertiljivenson9@gmail.com`}
          className="inline-flex items-center gap-2 border border-gray-600 text-gray-400 px-4 py-2 text-sm hover:text-white hover:border-gray-400 transition mb-6 rounded"
        >
          <Mail className="w-4 h-4" />
          Soporte y Contacto
        </a>

        {/* Creator Info */}
        <div className="border-t border-gray-800 pt-6 mb-6">
          <div className="flex flex-wrap items-center gap-2 text-gray-500 text-sm mb-3">
            <span>Creado con</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>por</span>
            <span className="text-white font-semibold">Vertil Jivenson</span>
          </div>
          <p className="text-gray-500 text-xs leading-relaxed max-w-2xl">
            Desarrollador autodidacta de 24 años con 3 años de experiencia creando aplicaciones web. 
            Apasionado por el aprendizaje continuo y la creación de experiencias digitales únicas.
          </p>
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

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowTerms(false)}>
          <div 
            className="bg-[#1a1a1a] rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-bold text-white">Términos y Condiciones</h2>
            </div>
            
            <div className="space-y-4 text-gray-300 text-sm">
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">1. Uso Comercial</h3>
                  <p>Esta aplicación está diseñada para uso comercial de pago. El acceso a contenido premium requiere una suscripción activa. El uso no autorizado del servicio para fines comerciales sin licencia está prohibido.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <GraduationCap className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">2. Uso Educativo</h3>
                  <p>El código fuente de esta aplicación puede ser utilizado con fines educativos y de aprendizaje. Se permite estudiar, analizar y aprender del código para propósitos académicos.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Scale className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">3. Copyright y Propiedad Intelectual</h3>
                  <p>
                    <strong>ADVERTENCIA:</strong> Queda estrictamente prohibido copiar, reproducir, distribuir o utilizar el diseño, código o cualquier elemento de esta aplicación sin autorización expresa. 
                    Cualquier violación de los derechos de autor será perseguida legalmente, pudiendo resultar en multas y sanciones de copyright.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-white">4. Soporte y Contacto</h3>
                  <p>
                    Para cualquier consulta, soporte técnico, solicitud de licencia o reporte de violación de derechos de autor, contactar a:
                    <a href="mailto:Vertiljivenson9@gmail.com" className="text-red-400 hover:text-red-300 ml-1">
                      Vertiljivenson9@gmail.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4 mt-4">
                <p className="text-gray-400 text-xs">
                  Al utilizar Vertiflix, aceptas estos términos y condiciones. El creador se reserva el derecho de modificar estos términos en cualquier momento.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setShowTerms(false)}
              className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </footer>
  )
}
