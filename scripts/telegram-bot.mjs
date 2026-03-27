/**
 * ═══════════════════════════════════════════════════════════════════
 * Bot de Telegram para Vertiflix
 * ═══════════════════════════════════════════════════════════════════
 * 
 * ⚠️ REGLAS ESTRICTAS:
 * - NO genera videoUrl con links de Telegram
 * - NO hace streaming
 * - NO usa MTProto
 * - SOLO produce datos estructurados para el backend
 * 
 * 🎯 SALIDA:
 * channelUsername + channelMessageId
 * 
 * 🔗 El frontend usa: /api/stream/${channelUsername}/${channelMessageId}
 * ═══════════════════════════════════════════════════════════════════
 */

import TelegramBot from 'node-telegram-bot-api'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ═════════════════════════════════════════════════════════════
// Cargar variables de entorno
// ═════════════════════════════════════════════════════════════
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
    }
  })
}

// ═════════════════════════════════════════════════════════════
// ✅ VALIDACIÓN ESTRICTA DE VARIABLES
// ═════════════════════════════════════════════════════════════
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN no configurado')
}

// ═════════════════════════════════════════════════════════════
// CREAR BOT
// ═════════════════════════════════════════════════════════════
const bot = new TelegramBot(BOT_TOKEN, { polling: true })

console.log('🤖 Vertiflix Bot iniciado!')
console.log('📱 Busca tu bot en Telegram y envía /start')

// Sesiones de usuario (en memoria)
const userSessions = new Map()

// ═════════════════════════════════════════════════════════════
// COMANDO /start
// ═════════════════════════════════════════════════════════════
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id
  userSessions.delete(chatId)
  
  bot.sendMessage(chatId, 
    `🎬 *Vertiflix Bot*\n\n` +
    `Envía un enlace de un mensaje de Telegram con video.\n\n` +
    `*Formatos aceptados:*\n` +
    `• \`https://t.me/canal/123\`\n` +
    `• \`https://t.me/+invite/123\`\n\n` +
    `*Comandos:*\n` +
    `/start - Reiniciar\n` +
    `/nueva - Agregar película\n` +
    `/help - Ayuda`,
    { parse_mode: 'Markdown' }
  )
})

// ═════════════════════════════════════════════════════════════
// COMANDO /help
// ═════════════════════════════════════════════════════════════
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId,
    `📚 *Ayuda de Vertiflix Bot*\n\n` +
    `*Cómo agregar una película:*\n` +
    `1. Envía el enlace del mensaje de Telegram\n` +
    `2. El bot extraerá canal y messageId\n` +
    `3. Proporciona título, año, categoría\n` +
    `4. Recibirás un JSON listo para importar\n\n` +
    `*Estructura de salida:*\n` +
    `\`\`\`\n` +
    `{\n` +
    `  "channelUsername": "canal",\n` +
    `  "channelMessageId": 123\n` +
    `}\n` +
    `\`\`\`\n\n` +
    `*Streaming:*\n` +
    `El backend usa estos datos para:\n` +
    `\`/api/stream/\${channelUsername}/\${channelMessageId}\``,
    { parse_mode: 'Markdown' }
  )
})

// ═════════════════════════════════════════════════════════════
// COMANDO /nueva - Iniciar proceso de agregar película
// ═════════════════════════════════════════════════════════════
bot.onText(/\/nueva/, (msg) => {
  const chatId = msg.chat.id
  
  userSessions.set(chatId, {
    step: 'waiting_link',
    movie: createEmptyMovie()
  })
  
  bot.sendMessage(chatId,
    `🎬 *Nueva Película*\n\n` +
    `Paso 1: Envía el enlace del mensaje de Telegram que contiene el video.\n\n` +
    `*Formato:* \`https://t.me/nombre_canal/123\``,
    { parse_mode: 'Markdown' }
  )
})

// ═════════════════════════════════════════════════════════════
// MANEJAR MENSAJES
// ═════════════════════════════════════════════════════════════
bot.on('message', async (msg) => {
  const chatId = msg.chat.id
  const text = msg.text || ''

  // Ignorar comandos
  if (text.startsWith('/')) return

  const session = userSessions.get(chatId)

  // ═══════════════════════════════════════════════════════════
  // PASO 1: Esperando link de Telegram
  // ═══════════════════════════════════════════════════════════
  if (session?.step === 'waiting_link') {
    const parsed = parseTelegramLink(text)
    
    if (!parsed) {
      bot.sendMessage(chatId,
        '❌ Enlace inválido.\n\n' +
        'Envía un enlace como: `https://t.me/canal/123`',
        { parse_mode: 'Markdown' }
      )
      return
    }

    // ✅ Guardar datos del canal (NO videoUrl)
    session.movie.channelUsername = parsed.channelUsername
    session.movie.channelMessageId = parsed.messageId
    session.step = 'waiting_title'
    
    bot.sendMessage(chatId,
      `✅ *Canal detectado:* @${parsed.channelUsername}\n` +
      `✅ *Mensaje ID:* ${parsed.messageId}\n\n` +
      `Paso 2: Escribe el título de la película:`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  // ═══════════════════════════════════════════════════════════
  // PASO 2: Esperando título
  // ═══════════════════════════════════════════════════════════
  if (session?.step === 'waiting_title') {
    session.movie.title = text.trim()
    session.step = 'waiting_year'
    
    bot.sendMessage(chatId, '📅 Paso 3: Escribe el año (ej: 2024):')
    return
  }

  // ═══════════════════════════════════════════════════════════
  // PASO 3: Esperando año
  // ═══════════════════════════════════════════════════════════
  if (session?.step === 'waiting_year') {
    const year = parseInt(text.trim())
    
    if (isNaN(year) || year < 1900 || year > 2030) {
      bot.sendMessage(chatId, '❌ Año inválido. Escribe un año válido (ej: 2024):')
      return
    }
    
    session.movie.year = year
    session.step = 'waiting_category'
    
    bot.sendMessage(chatId,
      '🎭 Paso 4: Elige una categoría:\n\n' +
      '1. Acción\n2. Drama\n3. Ciencia-Ficción\n4. Comedia\n5. Terror\n6. Anime\n7. Documental\n8. Serie\n\n' +
      'Escribe el número o el nombre:')
    return
  }

  // ═══════════════════════════════════════════════════════════
  // PASO 4: Esperando categoría
  // ═══════════════════════════════════════════════════════════
  if (session?.step === 'waiting_category') {
    const categories = {
      '1': 'accion', 'accion': 'accion',
      '2': 'drama', 'drama': 'drama',
      '3': 'ciencia-ficcion', 'ciencia-ficción': 'ciencia-ficcion', 'ciencia': 'ciencia-ficcion',
      '4': 'comedia', 'comedia': 'comedia',
      '5': 'terror', 'terror': 'terror',
      '6': 'anime', 'anime': 'anime',
      '7': 'documental', 'documental': 'documental',
      '8': 'serie', 'serie': 'serie'
    }
    
    const category = categories[text.trim().toLowerCase()]
    
    if (!category) {
      bot.sendMessage(chatId, '❌ Categoría inválida. Escribe el número o nombre:')
      return
    }
    
    session.movie.category = category
    session.step = 'waiting_description'
    
    bot.sendMessage(chatId, '📝 Paso 5: Escribe una breve descripción (opcional, o escribe "skip"):')
    return
  }

  // ═══════════════════════════════════════════════════════════
  // PASO 5: Esperando descripción
  // ═══════════════════════════════════════════════════════════
  if (session?.step === 'waiting_description') {
    if (text.toLowerCase() !== 'skip') {
      session.movie.description = text.trim()
    }
    session.step = 'waiting_thumbnail'
    
    bot.sendMessage(chatId, '🖼️ Paso 6: Envía una imagen como poster (opcional, o escribe "skip"):')
    return
  }

  // ═══════════════════════════════════════════════════════════
  // PASO 6: Esperando thumbnail
  // ═══════════════════════════════════════════════════════════
  if (session?.step === 'waiting_thumbnail') {
    // Si envió imagen
    if (msg.photo) {
      const photo = msg.photo[msg.photo.length - 1] // La más grande
      session.movie.thumbnail_file_id = photo.file_id
      session.movie.thumbnail = `telegram:${photo.file_id}`
    } else if (text.toLowerCase() !== 'skip') {
      // Si envió URL
      if (text.startsWith('http')) {
        session.movie.thumbnail = text.trim()
      }
    }
    
    session.step = 'confirm'
    
    // Mostrar resumen
    const movie = session.movie
    bot.sendMessage(chatId,
      `✅ *Resumen de la película:*\n\n` +
      `🎬 *Título:* ${movie.title}\n` +
      `📅 *Año:* ${movie.year}\n` +
      `🎭 *Categoría:* ${movie.category}\n` +
      `📝 *Descripción:* ${movie.description || 'Sin descripción'}\n\n` +
      `🔗 *Streaming data:*\n` +
      `   Canal: @${movie.channelUsername}\n` +
      `   Mensaje: ${movie.channelMessageId}\n\n` +
      `¿Confirmar? (sí/no)`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  // ═══════════════════════════════════════════════════════════
  // CONFIRMACIÓN
  // ═══════════════════════════════════════════════════════════
  if (session?.step === 'confirm') {
    if (text.toLowerCase() === 'sí' || text.toLowerCase() === 'si' || text.toLowerCase() === 'yes') {
      const movie = session.movie
      
      // ✅ GENERAR JSON CON FORMATO CORRECTO
      const output = generateMovieJSON(movie)
      
      // Guardar archivo
      const dataPath = path.join(__dirname, '..', `.movie_${chatId}.json`)
      fs.writeFileSync(dataPath, JSON.stringify(output, null, 2))
      
      bot.sendMessage(chatId,
        `✅ *Película lista para importar!*\n\n` +
        `📋 *Estructura generada:*\n` +
        `\`\`\`json\n${JSON.stringify(output, null, 2)}\n\`\`\`\n\n` +
        `🔗 *URL de streaming:*\n` +
        `\`/api/stream/${movie.channelUsername}/${movie.channelMessageId}\`\n\n` +
        `Usa /export para descargar el JSON completo.`,
        { parse_mode: 'Markdown' }
      )
      
      userSessions.delete(chatId)
    } else {
      bot.sendMessage(chatId, '❌ Cancelado. Usa /nueva para empezar de nuevo.')
      userSessions.delete(chatId)
    }
    return
  }

  // ═══════════════════════════════════════════════════════════
  // SIN SESIÓN - Parsear link directo
  // ═══════════════════════════════════════════════════════════
  const parsed = parseTelegramLink(text)
  
  if (parsed) {
    // Mostrar info del link
    const quickOutput = {
      channelUsername: parsed.channelUsername,
      channelMessageId: parsed.messageId,
      streamUrl: `/api/stream/${parsed.channelUsername}/${parsed.messageId}`
    }
    
    bot.sendMessage(chatId,
      `✅ *Link detectado:*\n\n` +
      `📢 *Canal:* @${parsed.channelUsername}\n` +
      `🆔 *Mensaje:* ${parsed.messageId}\n\n` +
      `🔗 *URL de streaming:*\n` +
      `\`/api/stream/${parsed.channelUsername}/${parsed.messageId}\`\n\n` +
      ` Usa /nueva para agregar esta película a tu catálogo.`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  // Mensaje por defecto
  bot.sendMessage(chatId,
    '❓ No entendí tu mensaje.\n\n' +
    'Usa /nueva para agregar una película o envía un enlace de Telegram.'
  )
})

// ═════════════════════════════════════════════════════════════
// COMANDO /export
// ═════════════════════════════════════════════════════════════
bot.onText(/\/export/, (msg) => {
  const chatId = msg.chat.id
  const dataPath = path.join(__dirname, '..', `.movie_${chatId}.json`)

  if (!fs.existsSync(dataPath)) {
    bot.sendMessage(chatId, '❌ No hay película guardada. Usa /nueva primero.')
    return
  }

  bot.sendDocument(chatId, dataPath, {
    caption: '🎬 Película lista para importar en Vertiflix',
  })
})

// ═════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═════════════════════════════════════════════════════════════

/**
 * Crear película vacía con valores por defecto
 */
function createEmptyMovie() {
  return {
    id: `tg_${Date.now()}`,
    title: '',
    description: '',
    thumbnail: 'https://via.placeholder.com/500x750?text=No+Poster',
    category: 'accion',
    year: new Date().getFullYear(),
    duration: 120,
    rating: 0,
    language: 'Español',
    // 🔥 CLAVE: NO videoUrl, sino estos dos:
    channelUsername: '',
    channelMessageId: 0
  }
}

/**
 * ✅ PARSEAR LINK DE TELEGRAM
 * Extrae: channelUsername y messageId
 * 
 * Formatos:
 * - https://t.me/canal/123
 * - https://t.me/+invite/123
 * - @canal/123
 */
function parseTelegramLink(text) {
  // Patrón 1: https://t.me/canal/123
  const match1 = text.match(/t\.me\/([a-zA-Z0-9_]+)\/(\d+)/)
  if (match1) {
    return {
      channelUsername: match1[1],
      messageId: parseInt(match1[2], 10)
    }
  }

  // Patrón 2: @canal/123
  const match2 = text.match(/@([a-zA-Z0-9_]+)\/(\d+)/)
  if (match2) {
    return {
      channelUsername: match2[1],
      messageId: parseInt(match2[2], 10)
    }
  }

  // Patrón 3: Solo canal (sin mensaje)
  const match3 = text.match(/t\.me\/([a-zA-Z0-9_]+)/)
  if (match3) {
    return {
      channelUsername: match3[1],
      messageId: null // Sin mensaje específico
    }
  }

  return null
}

/**
 * ✅ GENERAR JSON DE PELÍCULA
 * Formato obligatorio para el frontend
 */
function generateMovieJSON(movie) {
  return {
    id: movie.id,
    title: movie.title,
    description: movie.description,
    thumbnail: movie.thumbnail,
    category: movie.category,
    year: movie.year,
    duration: movie.duration,
    rating: movie.rating,
    language: movie.language,
    // 🔥 DATOS PARA STREAMING (NO videoUrl)
    channelUsername: movie.channelUsername,
    channelMessageId: movie.channelMessageId,
    // Metadatos
    created_at: new Date().toISOString(),
    source: 'telegram-bot'
  }
}

// ═════════════════════════════════════════════════════════════
// MANEJAR ERRORES
// ═════════════════════════════════════════════════════════════
bot.on('polling_error', (error) => {
  console.error('❌ Error de polling:', error.message)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Error no capturado:', error.message)
})
