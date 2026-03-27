'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Play, Loader2 } from 'lucide-react'

/**
 * Página de prueba para verificar que el Telegram Post Widget funciona
 * Link de prueba: https://t.me/VertiflixVideos/11
 * 
 * Método correcto: usar <script> con data-telegram-post
 */

export default function TestEmbedPage() {
  const [isLoading, setIsLoading] = useState(true)
  
  // El link real que me diste: https://t.me/VertiflixVideos/11
  const telegramLink = 'https://t.me/VertiflixVideos/11'
  
  // Parsear el link
  const match = telegramLink.match(/t\.me\/([^\/]+)\/(\d+)/)
  
  const channel = match?.[1] || 'VertiflixVideos'
  const messageId = match?.[2] || '11'
  
  // Para el widget: canal/messageId
  const postWidget = `${channel}/${messageId}`

  // Cargar el script de Telegram
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-post', postWidget)
    script.setAttribute('data-width', '100%')
    script.onload = () => setIsLoading(false)
    script.onerror = () => {
      setIsLoading(false)
      console.error('Error loading Telegram widget')
    }
    
    const container = document.getElementById('telegram-widget-container')
    if (container) {
      container.innerHTML = ''
      container.appendChild(script)
    }
    
    return () => {
      if (container) {
        container.innerHTML = ''
      }
    }
  }, [postWidget])

  return (
    <div className="min-h-screen bg-[#141414] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white text-2xl font-bold mb-2">
            🧪 Prueba de Telegram Post Widget (MÉTODO CORRECTO)
          </h1>
          <p className="text-white/60 text-sm">
            Usando el widget oficial con data-telegram-post
          </p>
        </div>

        {/* Info del link */}
        <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6">
          <h2 className="text-white font-semibold mb-3">📋 Información del link:</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-white/50">Link original:</span>
              <p className="text-[#0088cc] break-all">{telegramLink}</p>
            </div>
            <div>
              <span className="text-white/50">data-telegram-post:</span>
              <p className="text-green-400">{postWidget}</p>
            </div>
          </div>
        </div>

        {/* Botones de prueba */}
        <div className="flex gap-4 mb-6">
          <a
            href={telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-[#0088cc] rounded-lg text-white hover:bg-[#0077bb] transition"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir en Telegram
          </a>
        </div>

        {/* Contenedor del widget */}
        <div className="bg-black rounded-lg overflow-hidden">
          <div className="p-4 bg-[#1a1a1a] border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-semibold">
              📺 Telegram Post Widget (script)
            </h3>
            {isLoading && (
              <span className="flex items-center gap-2 text-yellow-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando widget...
              </span>
            )}
          </div>
          
          <div className="p-4" style={{ minHeight: '400px' }}>
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-white animate-spin mx-auto mb-3" />
                  <p className="text-white/70">Cargando widget de Telegram...</p>
                </div>
              </div>
            )}
            <div id="telegram-widget-container"></div>
          </div>
        </div>

        {/* Código usado */}
        <div className="mt-6 bg-[#0a0a0a] rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">💻 Código correcto:</h3>
          <pre className="text-green-400 text-xs overflow-x-auto">
{`<script async 
  src="https://telegram.org/js/telegram-widget.js?22" 
  data-telegram-post="${postWidget}" 
  data-width="100%">
</script>`}
          </pre>
        </div>

        {/* Comparación */}
        <div className="mt-6 bg-[#1a1a1a] rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">❌ vs ✅</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
              <p className="text-red-400 font-semibold mb-2">❌ INCORRECTO (lo que yo hice):</p>
              <code className="text-white/70 text-xs">
                &lt;iframe src="https://t.me/...?embed=1"&gt;
              </code>
              <p className="text-white/50 text-xs mt-2">Solo muestra preview, NO reproduce video</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
              <p className="text-green-400 font-semibold mb-2">✅ CORRECTO (método oficial):</p>
              <code className="text-white/70 text-xs">
                &lt;script data-telegram-post="canal/id"&gt;
              </code>
              <p className="text-white/50 text-xs mt-2">Widget oficial con reproductor integrado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
