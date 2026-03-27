/**
 * Utilidades para transformar URLs de video
 * Especialmente para Google Drive que requiere iframe embed
 */

/**
 * Extrae el ID de un archivo de Google Drive desde múltiples formatos de URL
 * Soporta:
 * - https://drive.google.com/file/d/{ID}/view
 * - https://drive.google.com/file/d/{ID}/view?usp=sharing
 * - https://drive.google.com/file/d/{ID}/preview
 * - https://drive.google.com/open?id={ID}
 * - https://drive.google.com/uc?id={ID}
 * - https://drive.google.com/uc?export=download&id={ID}
 */
export function extractGoogleDriveId(url: string): string | null {
  if (!url || !url.includes('drive.google.com')) return null

  // Patrón 1: /file/d/{ID}/
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch?.[1]) return fileMatch[1]

  // Patrón 2: /d/{ID}/
  const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (dMatch?.[1]) return dMatch[1]

  // Patrón 3: open?id={ID} o uc?id={ID}
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch?.[1]) return idMatch[1]

  return null
}

/**
 * Genera la URL de embed/preview para Google Drive
 */
export function getGoogleDriveEmbedUrl(urlOrId: string): string | null {
  // Si ya es un ID puro (no contiene punto ni slash)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(urlOrId)) {
    return `https://drive.google.com/file/d/${urlOrId}/preview`
  }

  const id = extractGoogleDriveId(urlOrId)
  if (!id) return null

  return `https://drive.google.com/file/d/${id}/preview`
}

/**
 * Detecta el tipo de video por URL
 */
export function detectVideoType(url: string): 'google-drive' | 'youtube' | 'telegram' | 'direct' | 'unknown' {
  if (!url) return 'unknown'

  if (url.includes('drive.google.com')) return 'google-drive'
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('t.me/') || url.includes('telegram.org')) return 'telegram'

  // URLs directas de video
  if (/\.(mp4|webm|ogg|mkv|avi)(\?.*)?$/i.test(url)) return 'direct'
  if (url.includes('/stream/') || url.includes('/video/')) return 'direct'

  return 'unknown'
}

/**
 * Valida y normaliza una URL de video
 * Retorna la URL lista para usar (embed para Drive, directa para otros)
 */
export function normalizeVideoUrl(url: string): { type: string; url: string; embedUrl?: string } {
  const type = detectVideoType(url)

  if (type === 'google-drive') {
    const embedUrl = getGoogleDriveEmbedUrl(url)
    return { type, url, embedUrl: embedUrl || undefined }
  }

  if (type === 'youtube') {
    const videoId = url.includes('youtu.be')
      ? url.split('youtu.be/')[1]?.split('?')[0]
      : url.split('v=')[1]?.split('&')[0]

    if (videoId) {
      return {
        type,
        url,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1`
      }
    }
  }

  return { type, url }
}
