// Telegram Real Scraper - Configuración
// Este módulo requiere autenticación previa via CLI

import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'

const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0')
const API_HASH = process.env.TELEGRAM_API_HASH || ''

// Session storage (en producción usar Redis o base de datos)
let savedSession = ''

export function setSession(sessionString: string) {
  savedSession = sessionString
}

export function getSession(): string {
  return savedSession
}

// Verificar si hay sesión activa
export async function checkTelegramAuth(): Promise<boolean> {
  return savedSession.length > 0
}

// Scrapear canal real de Telegram
export async function scrapeRealChannel(
  channelUsername: string,
  limit: number = 20
) {
  if (!savedSession) {
    return {
      success: false,
      movies: [],
      error: 'No hay sesión de Telegram. Ejecuta primero el script de autenticación.',
      requiresAuth: true
    }
  }

  try {
    const stringSession = new StringSession(savedSession)
    const client = new TelegramClient(stringSession, API_ID, API_HASH, {
      connectionRetries: 5,
    })

    await client.connect()

    if (!client.connected) {
      return {
        success: false,
        movies: [],
        error: 'No se pudo conectar a Telegram'
      }
    }

    // Obtener mensajes del canal
    const messages = await client.getMessages(channelUsername, { limit })

    const movies = []
    
    for (const msg of messages) {
      if (!msg.message) continue

      // Detectar si el mensaje contiene video/documento
      const hasMedia = msg.media && ('document' in msg.media || 'photo' in msg.media)
      
      // Extraer título del mensaje
      const lines = msg.message.split('\n')
      const title = lines[0].substring(0, 100) // Primera línea como título

      movies.push({
        id: `tg_${msg.id}`,
        title: title || 'Sin título',
        description: msg.message.substring(0, 500),
        thumbnail: 'https://via.placeholder.com/500x750?text=' + encodeURIComponent(title.substring(0, 20)),
        videoUrl: `https://t.me/${channelUsername}/${msg.id}`,
        sourceChannel: channelUsername,
        messageId: String(msg.id),
        views: (msg as unknown as { views?: number }).views || 0,
        date: new Date((msg.date || 0) * 1000),
        hasMedia
      })
    }

    return {
      success: true,
      movies,
      total: movies.length,
      channelName: channelUsername
    }

  } catch (error) {
    console.error('Error scraping Telegram:', error)
    return {
      success: false,
      movies: [],
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}
