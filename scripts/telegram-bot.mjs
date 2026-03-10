/**
 * Bot de Telegram para Vertiflix
 * 
 * Uso:
 * 1. Asegúrate de tener TELEGRAM_BOT_TOKEN en .env.local
 * 2. Ejecuta: bun run telegram-bot
 * 3. Busca tu bot en Telegram y envía un enlace de canal
 */

import TelegramBot from 'node-telegram-bot-api'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Cargar variables de entorno
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

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_API_ID

if (!BOT_TOKEN) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN no configurado')
  console.log('📝 Crea un bot con @BotFather en Telegram y agrega el token a .env.local:')
  console.log('   TELEGRAM_BOT_TOKEN=tu_token_aqui')
  process.exit(1)
}

// Crear bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true })

console.log('🤖 Vertiflix Bot iniciado!')
console.log('📱 Busca tu bot en Telegram y envía /start')

// Comando /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, 
    `🎬 *Vertiflix Bot*\n\n` +
    `Envía el enlace de un canal de Telegram y extraeré las películas.\n\n` +
    `*Ejemplo:*\n` +
    `\`https://t.me/nombre_canal\`\n\n` +
    `*Comandos disponibles:*\n` +
    `/start - Ver este mensaje\n` +
    `/help - Ayuda`,
    { parse_mode: 'Markdown' }
  )
})

// Comando /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId,
    `📚 *Ayuda de Vertiflix Bot*\n\n` +
    `*Cómo usar:*\n` +
    `1. Encuentra un canal de películas en Telegram\n` +
    `2. Copia el enlace del canal\n` +
    `3. Pégalo aquí\n` +
    `4. Recibirás las películas encontradas\n\n` +
    `*Formatos aceptados:*\n` +
    `• https://t.me/canal\n` +
    `• https://t.me/+enlace_privado\n` +
    `• @nombre_canal`,
    { parse_mode: 'Markdown' }
  )
})

// Detectar enlaces de canales
bot.on('message', async (msg) => {
  const chatId = msg.chat.id
  const text = msg.text || ''

  // Ignorar comandos
  if (text.startsWith('/')) return

  // Detectar si es un enlace de Telegram
  const channelMatch = text.match(/t\.me\/([^\s]+)/) || text.match(/^@([a-zA-Z0-9_]+)/)

  if (!channelMatch) {
    bot.sendMessage(chatId, 
      '❌ No detecté un enlace de canal válido.\n\n' +
      'Envía un enlace como: `https://t.me/nombre_canal`',
      { parse_mode: 'Markdown' }
    )
    return
  }

  const channelUsername = channelMatch[1]
  
  bot.sendMessage(chatId, `🔍 Analizando canal: @${channelUsername}...\n⏳ Esto puede tomar unos segundos.`)

  try {
    // Scrapear el canal (modo demo por ahora)
    const movies = await scrapeChannel(channelUsername)
    
    if (movies.length === 0) {
      bot.sendMessage(chatId, '❌ No encontré películas en este canal.')
      return
    }

    // Enviar resumen
    let message = `🎬 *Películas encontradas: ${movies.length}*\n\n`
    
    movies.slice(0, 10).forEach((movie, i) => {
      message += `${i + 1}. *${movie.title}*\n`
      message += `   📅 ${movie.year} | ⭐ ${movie.rating}\n`
    })

    if (movies.length > 10) {
      message += `\n_...y ${movies.length - 10} más._`
    }

    message += `\n\n✅ Envía /import para obtener el JSON completo.`

    // Guardar películas temporalmente
    const dataPath = path.join(__dirname, '..', `.movies_${chatId}.json`)
    fs.writeFileSync(dataPath, JSON.stringify(movies, null, 2))

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })

  } catch (error) {
    console.error('Error scraping:', error)
    bot.sendMessage(chatId, '❌ Error al analizar el canal. Asegúrate de que el canal existe y es público.')
  }
})

// Comando /import
bot.onText(/\/import/, (msg) => {
  const chatId = msg.chat.id
  const dataPath = path.join(__dirname, '..', `.movies_${chatId}.json`)

  if (!fs.existsSync(dataPath)) {
    bot.sendMessage(chatId, '❌ No hay películas guardadas. Primero analiza un canal.')
    return
  }

  const movies = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
  
  // Enviar archivo JSON
  bot.sendDocument(chatId, dataPath, {
    caption: `🎬 ${movies.length} películas listas para importar\n\nCopia este JSON y úsalo en tu panel admin.`,
  })
})

// Función para scrapear canal
async function scrapeChannel(channel: string) {
  // Películas de demostración (en producción, conectar con API real)
  const sampleMovies = [
    { title: 'Dune: Parte Dos', year: 2024, rating: 8.8, genre: 'ciencia-ficcion' },
    { title: 'Oppenheimer', year: 2023, rating: 8.9, genre: 'drama' },
    { title: 'John Wick 4', year: 2023, rating: 8.2, genre: 'accion' },
    { title: 'Spider-Man: Multiverso', year: 2023, rating: 8.7, genre: 'animacion' },
    { title: 'Barbie', year: 2023, rating: 7.0, genre: 'comedia' },
    { title: 'Killers of the Flower Moon', year: 2023, rating: 8.5, genre: 'drama' },
    { title: 'The Batman', year: 2022, rating: 8.1, genre: 'accion' },
    { title: 'Top Gun: Maverick', year: 2022, rating: 8.3, genre: 'accion' },
    { title: 'Demon Slayer: Tren Infinito', year: 2020, rating: 8.6, genre: 'anime' },
    { title: 'Your Name', year: 2016, rating: 8.9, genre: 'anime' },
  ]

  return sampleMovies.map((movie, i) => ({
    id: `tg_${Date.now()}_${i}`,
    title: movie.title,
    description: `Importado desde @${channel}`,
    thumbnail: `https://via.placeholder.com/500x750?text=${encodeURIComponent(movie.title)}`,
    videoUrl: `https://t.me/${channel}/${1000 + i}`,
    category: movie.genre,
    year: movie.year,
    duration: 120,
    rating: movie.rating,
    featured: false,
    language: 'Español'
  }))
}

// Manejar errores
bot.on('polling_error', (error) => {
  console.error('❌ Error de polling:', error.message)
})
