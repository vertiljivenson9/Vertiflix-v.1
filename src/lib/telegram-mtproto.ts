/**
 * ═══════════════════════════════════════════════════════════════════
 * Telegram MTProto Streaming Module
 * ═══════════════════════════════════════════════════════════════════
 * 
 * ✅ USA TELEGRAM_SESSION (sesión de usuario) - NO BOT_TOKEN
 * ✅ Descarga archivos de CUALQUIER tamaño
 * ✅ Soporte completo para Range Requests
 * ✅ Sin límites de Bot API (20MB)
 * 
 * ⚠️ REQUISITO:
 *    - Ejecutar scripts/telegram-auth.mjs para obtener TELEGRAM_SESSION
 *    - Guardar TELEGRAM_SESSION en variables de entorno de Vercel
 * ═══════════════════════════════════════════════════════════════════
 */

import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import { Api } from 'telegram'

// ═════════════════════════════════════════════════════════════
// CONFIGURACIÓN - SOLO MTProto con sesión de usuario
// ═════════════════════════════════════════════════════════════
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0')
const API_HASH = process.env.TELEGRAM_API_HASH || ''
const SESSION_STRING = process.env.TELEGRAM_SESSION || ''

// Cliente singleton
let client: TelegramClient | null = null
let connectionPromise: Promise<TelegramClient> | null = null

/**
 * ✅ Verifica si MTProto está configurado correctamente
 */
export function isMTProtoConfigured(): boolean {
  return !!(API_ID && API_HASH && SESSION_STRING)
}

/**
 * ✅ Obtiene el cliente de Telegram con sesión de usuario
 * USA TELEGRAM_SESSION - NO BOT_TOKEN
 */
export async function getTelegramClient(): Promise<TelegramClient> {
  if (client && client.connected) {
    return client
  }

  if (connectionPromise) {
    return connectionPromise
  }

  connectionPromise = (async () => {
    if (!API_ID || !API_HASH) {
      throw new Error('TELEGRAM_API_ID y TELEGRAM_API_HASH son requeridos')
    }

    if (!SESSION_STRING) {
      throw new Error('TELEGRAM_SESSION no configurado. Ejecuta scripts/telegram-auth.mjs')
    }

    // ✅ Usar sesión guardada (usuario autenticado)
    const stringSession = new StringSession(SESSION_STRING)

    const newClient = new TelegramClient(stringSession, API_ID, API_HASH, {
      connectionRetries: 5,
      timeout: 30000,
      autoReconnect: true,
      useWSS: false,
    })

    console.log('🔄 Conectando a Telegram MTProto...')

    await newClient.connect()

    if (!newClient.connected) {
      throw new Error('No se pudo conectar a Telegram')
    }

    // Verificar que la sesión es válida
    const authorized = await newClient.checkAuthorization()
    if (!authorized) {
      throw new Error('Sesión de Telegram inválida o expirada. Ejecuta scripts/telegram-auth.mjs')
    }

    client = newClient
    connectionPromise = null

    console.log('✅ Cliente MTProto conectado con sesión de usuario')
    return client
  })()

  return connectionPromise
}

/**
 * Desconecta el cliente
 */
export async function disconnectClient(): Promise<void> {
  if (client) {
    await client.disconnect()
    client = null
  }
}

/**
 * Información de un archivo
 */
export interface TelegramFileInfo {
  id: string
  accessHash: string
  fileReference: Buffer
  dcId: number
  size: number
  mimeType: string
  fileName?: string
  type: 'video' | 'document' | 'photo'
  inputLocation?: Api.TypeInputFileLocation
}

/**
 * Obtiene información de un archivo desde un mensaje
 */
export async function getFileInfoFromMessage(
  channelUsername: string,
  messageId: number
): Promise<TelegramFileInfo | null> {
  try {
    const tgClient = await getTelegramClient()

    console.log(`📥 Obteniendo info: ${channelUsername}/${messageId}`)

    // Resolver el canal
    let entity: any
    try {
      entity = await tgClient.getEntity(channelUsername)
    } catch {
      // Intentar con @
      entity = await tgClient.getEntity(
        channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`
      )
    }

    // Obtener el mensaje
    const messages = await tgClient.getMessages(entity, { ids: [messageId] })

    if (!messages.length || !messages[0]) {
      console.error('❌ Mensaje no encontrado')
      return null
    }

    const message = messages[0]

    if (!message.media) {
      console.error('❌ El mensaje no tiene media')
      return null
    }

    let document: Api.Document | null = null
    let type: 'video' | 'document' | 'photo' = 'document'
    let inputLocation: Api.TypeInputFileLocation | null = null

    // Extraer documento
    if (message.media instanceof Api.MessageMediaDocument && message.media.document) {
      document = message.media.document as Api.Document

      const mimeType = document.mimeType || ''
      if (mimeType.startsWith('video/')) {
        type = 'video'
      }

      // Crear InputDocumentFileLocation para descarga
      inputLocation = new Api.InputDocumentFileLocation({
        id: document.id,
        accessHash: document.accessHash,
        fileReference: document.fileReference,
        thumbSize: '',
      })

    } else if (message.media instanceof Api.MessageMediaPhoto) {
      const photo = message.media.photo
      if (photo instanceof Api.Photo) {
        const sizes = photo.sizes
        const largestSize = sizes.find(s => s instanceof Api.PhotoSize)
        if (largestSize instanceof Api.PhotoSize) {
          type = 'photo'
          inputLocation = new Api.InputPhotoFileLocation({
            id: photo.id,
            accessHash: photo.accessHash,
            fileReference: photo.fileReference,
            thumbSize: largestSize.type,
          })
          return {
            id: photo.id.toString(),
            accessHash: photo.accessHash.toString(),
            fileReference: photo.fileReference,
            dcId: photo.dcId,
            size: largestSize.size,
            mimeType: 'image/jpeg',
            type,
            inputLocation
          }
        }
      }
    }

    if (!document || !inputLocation) {
      console.error('❌ No se encontró documento')
      return null
    }

    console.log(`✅ Documento encontrado: ${(document.size.toNumber() / 1024 / 1024).toFixed(2)} MB`)

    return {
      id: document.id.toString(),
      accessHash: document.accessHash.toString(),
      fileReference: document.fileReference,
      dcId: document.dcId,
      size: document.size.toNumber(),
      mimeType: document.mimeType || 'application/octet-stream',
      fileName: document.attributes
        .find((attr): attr is Api.DocumentAttributeFilename =>
          attr instanceof Api.DocumentAttributeFilename
        )?.fileName,
      type,
      inputLocation
    }
  } catch (error) {
    console.error('❌ Error obteniendo info:', error)
    return null
  }
}

/**
 * Descarga archivo usando iterDownload - SIN LÍMITE DE TAMAÑO
 */
export async function* downloadFileStream(
  fileInfo: TelegramFileInfo,
  startByte: number = 0,
  endByte?: number
): AsyncGenerator<Buffer, void, unknown> {
  const tgClient = await getTelegramClient()

  if (!fileInfo.inputLocation) {
    throw new Error('No hay inputLocation para descargar')
  }

  const totalSize = fileInfo.size
  const end = endByte !== undefined ? Math.min(endByte, totalSize - 1) : totalSize - 1

  console.log(`📥 Descargando: ${startByte}-${end}/${totalSize} (${((end - startByte + 1) / 1024 / 1024).toFixed(2)} MB)`)

  const chunkSize = 1024 * 1024 // 1MB por chunk

  try {
    const downloader = tgClient.iterDownload(fileInfo.inputLocation, {
      offset: startByte,
      limit: end - startByte + 1,
      requestSize: chunkSize,
    })

    for await (const chunk of downloader) {
      yield Buffer.from(chunk)
    }

    console.log('✅ Descarga completada')
  } catch (error) {
    console.error('❌ Error en iterDownload:', error)
    throw error
  }
}

/**
 * Obtiene archivo desde link de Telegram
 */
export async function getFileFromTelegramLink(
  link: string
): Promise<{ fileInfo: TelegramFileInfo; channelUsername: string; messageId: number } | null> {
  try {
    let channelUsername = ''
    let messageId = 0

    const patterns = [
      /t\.me\/([a-zA-Z0-9_]+)\/(\d+)/,
      /t\.me\/c\/(\d+)\/(\d+)/,
      /^@([a-zA-Z0-9_]+)\/(\d+)$/,
    ]

    for (const pattern of patterns) {
      const match = link.match(pattern)
      if (match) {
        channelUsername = match[1]
        messageId = parseInt(match[2], 10)
        break
      }
    }

    if (!channelUsername || !messageId) {
      return null
    }

    const fileInfo = await getFileInfoFromMessage(channelUsername, messageId)

    if (!fileInfo) {
      return null
    }

    return { fileInfo, channelUsername, messageId }
  } catch (error) {
    console.error('❌ Error procesando link:', error)
    return null
  }
}

// Helper functions
export function hasSession(): boolean {
  return !!SESSION_STRING
}

export function getFileSize(fileInfo: TelegramFileInfo): number {
  return fileInfo.size
}

export function isStreamable(mimeType: string): boolean {
  return mimeType.startsWith('video/') || mimeType.startsWith('audio/')
}

export function getSessionString(): string | null {
  return SESSION_STRING || null
}
