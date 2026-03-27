/**
 * ═════════════════════════════════════════════════════════════════╗
 * ║           STREAMING ENDPOINT - SOLO MTPROTO                     ║
 * ║                                                                ║
 * ║   PROHIBIDO: links t.me, widgets, redirecciones, BOT_TOKEN     ║
 * ║   PERMITIDO: Solo MTProto con TELEGRAM_SESSION                 ║
 * ╚════════════════════════════════════════════════════════════════╝
 * 
 * Uso: GET /api/stream/:chatId/:videoId
 * Ejemplo: /api/stream/@VertiflixVideos/22
 * 
 * El navegador ve: /api/stream/@Canal/123
 * El backend hace: MTProto → Telegram DC → Stream → Cliente
 * 
 * ⚠️ REQUIERE: TELEGRAM_SESSION en variables de entorno
 *    Ejecutar: scripts/telegram-auth.mjs
 */

import { NextRequest, NextResponse } from 'next/server'
import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { Api } from 'telegram'

export const runtime = 'nodejs'
export const maxDuration = 300

// ═════════════════════════════════════════════════════════════
// CONFIGURACIÓN - SOLO MTProto con sesión de usuario
// ═════════════════════════════════════════════════════════════
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0')
const API_HASH = process.env.TELEGRAM_API_HASH || ''
const SESSION_STRING = process.env.TELEGRAM_SESSION || ''

// Cliente singleton
let client: TelegramClient | null = null

/**
 * Parsea el header Range de HTTP
 */
function parseRange(range: string | null, size: number): { start: number; end: number } | null {
  if (!range) return null
  const m = /bytes=(\d+)-(\d*)/.exec(range)
  if (!m) return null
  const start = parseInt(m[1], 10)
  const end = m[2] ? parseInt(m[2], 10) : size - 1
  if (isNaN(start) || isNaN(end) || start > end || start >= size) return null
  return { start, end }
}

/**
 * ✅ Obtiene cliente MTProto con sesión de usuario
 * NO usa BOT_TOKEN
 */
async function getClient(): Promise<TelegramClient> {
  if (client && client.connected) return client

  if (!API_ID || !API_HASH) {
    throw new Error('TELEGRAM_API_ID y TELEGRAM_API_HASH son requeridos')
  }

  if (!SESSION_STRING) {
    throw new Error('TELEGRAM_SESSION no configurado. Ejecuta scripts/telegram-auth.mjs')
  }

  // ✅ Usar sesión guardada
  const session = new StringSession(SESSION_STRING)
  
  const newClient = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 5,
    timeout: 30000,
    useWSS: false,
  })

  await newClient.connect()

  if (!await newClient.checkAuthorization()) {
    throw new Error('Sesión de Telegram inválida. Ejecuta scripts/telegram-auth.mjs')
  }

  client = newClient
  return client
}

/**
 * GET - Streaming de video
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string; videoId: string }> }
) {
  const { chatId, videoId } = await params

  console.log(`[STREAM] chatId=${chatId} videoId=${videoId}`)

  try {
    const tgClient = await getClient()

    // Resolver entidad (canal)
    let entity: any
    try {
      entity = await tgClient.getEntity(chatId)
    } catch {
      entity = await tgClient.getEntity(chatId.startsWith('@') ? chatId : `@${chatId}`)
    }

    // Obtener mensaje
    const messages = await tgClient.getMessages(entity, { ids: [parseInt(videoId, 10)] })
    const msg = messages[0]

    if (!msg) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 })
    }

    // Extraer media
    let file: any = null
    let size = 0
    let mimeType = 'video/mp4'

    if (msg.media instanceof Api.MessageMediaDocument && msg.media.document) {
      const doc = msg.media.document as Api.Document
      file = doc
      size = doc.size.toNumber()
      mimeType = doc.mimeType || 'video/mp4'
    } else if (msg.media instanceof Api.MessageMediaPhoto) {
      const photo = msg.media.photo
      if (photo instanceof Api.Photo) {
        const sizes = photo.sizes
        const photoSize = sizes.find((s: any) => s instanceof Api.PhotoSize)
        if (photoSize instanceof Api.PhotoSize) {
          file = photo
          size = photoSize.size
          mimeType = 'image/jpeg'
        }
      }
    }

    if (!file) {
      return NextResponse.json({ error: 'No hay video/archivo en el mensaje' }, { status: 404 })
    }

    console.log(`[STREAM] ${(size / 1024 / 1024).toFixed(2)} MB - ${mimeType}`)

    // Parsear Range
    const rangeHeader = request.headers.get('range')
    const range = parseRange(rangeHeader, size)

    const start = range?.start ?? 0
    const end = range ? Math.min(range.end, size - 1) : size - 1
    const contentLength = end - start + 1

    // Crear stream con iterDownload
    const chunkSize = 1024 * 1024 // 1MB chunks
    let offset = start

    // Crear InputFileLocation para descarga
    let inputLocation: Api.TypeInputFileLocation
    if (file instanceof Api.Document) {
      inputLocation = new Api.InputDocumentFileLocation({
        id: file.id,
        accessHash: file.accessHash,
        fileReference: file.fileReference,
        thumbSize: '',
      })
    } else if (file instanceof Api.Photo) {
      const sizes = file.sizes
      const photoSize = sizes.find((s: any) => s instanceof Api.PhotoSize)
      inputLocation = new Api.InputPhotoFileLocation({
        id: file.id,
        accessHash: file.accessHash,
        fileReference: file.fileReference,
        thumbSize: photoSize instanceof Api.PhotoSize ? photoSize.type : 'w',
      })
    } else {
      return NextResponse.json({ error: 'Tipo de archivo no soportado' }, { status: 400 })
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const downloader = tgClient.iterDownload(inputLocation, {
            offset: start,
            limit: end - start + 1,
            requestSize: chunkSize,
          })

          for await (const chunk of downloader) {
            controller.enqueue(chunk)
          }
          controller.close()
        } catch (err) {
          console.error('[STREAM ERROR]', err)
          controller.error(err)
        }
      }
    })

    const headers: Record<string, string> = {
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    }

    if (range) {
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`
      headers['Content-Length'] = contentLength.toString()
      return new NextResponse(stream, { status: 206, headers })
    } else {
      headers['Content-Length'] = size.toString()
      return new NextResponse(stream, { status: 200, headers })
    }

  } catch (error) {
    console.error('[STREAM ERROR]', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown'
    
    // Errores específicos
    if (errorMessage.includes('TELEGRAM_SESSION')) {
      return NextResponse.json({
        error: 'Configuración incompleta',
        hint: 'Ejecuta scripts/telegram-auth.mjs para configurar TELEGRAM_SESSION',
        details: errorMessage
      }, { status: 500 })
    }
    
    return NextResponse.json({
      error: 'Error en streaming',
      details: errorMessage
    }, { status: 500 })
  }
}

/**
 * HEAD - Información del archivo sin descargar
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string; videoId: string }> }
) {
  const { chatId, videoId } = await params

  try {
    const tgClient = await getClient()
    
    let entity: any
    try {
      entity = await tgClient.getEntity(chatId)
    } catch {
      entity = await tgClient.getEntity(chatId.startsWith('@') ? chatId : `@${chatId}`)
    }
    
    const messages = await tgClient.getMessages(entity, { ids: [parseInt(videoId, 10)] })
    const msg = messages[0]

    if (!msg?.media) {
      return new NextResponse(null, { status: 404 })
    }

    let size = 0
    let mimeType = 'video/mp4'

    if (msg.media instanceof Api.MessageMediaDocument && msg.media.document) {
      const doc = msg.media.document as Api.Document
      size = doc.size.toNumber()
      mimeType = doc.mimeType || 'video/mp4'
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': size.toString(),
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
      }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
