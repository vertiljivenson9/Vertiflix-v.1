# 🎬 Sistema de Streaming con Telegram - Arquitectura Técnica

## 📋 Resumen

Este documento explica cómo funciona el sistema de streaming de video usando Telegram como almacenamiento, sin servicios pagos, sin CDN, y con reproducción fluida.

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE STREAMING                          │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
    │   Usuario    │ ◄─────► │   Tu Backend     │ ◄─────► │  Telegram    │
    │  (Navegador) │         │   (Proxy API)    │         │    API       │
    └──────────────┘         └──────────────────┘         └──────────────┘
           │                         │                           │
           │                         │                           │
           ▼                         ▼                           ▼
    ┌──────────────┐         ┌──────────────────┐         ┌──────────────┐
    │  Reproductor │         │ /api/stream/     │         │   Canal de   │
    │    HTML5     │         │ :chatId/:videoId │         │   Telegram   │
    │  <video>     │         │  (MTProto Proxy) │         │ (Almacenam.) │
    └──────────────┘         └──────────────────┘         └──────────────┘
```

---

## 🔧 ¿Por qué aparece "Pantalla Negra"?

### Causas del problema:

1. **URLs de Telegram expiran**: Las URLs de archivo (`api.telegram.org/file/bot...`) son temporales
2. **Sin soporte de Range**: Sin headers `Range`, el navegador intenta descargar todo el archivo
3. **Metadata al final del MP4**: El "moov atom" está al final, impidiendo streaming progresivo
4. **Sin pre-buffering**: El reproductor no tiene datos suficientes para empezar

### Nuestra solución:

```typescript
// 1. Usar MTProto para obtener archivos de cualquier tamaño
const client = await getTelegramClient()
const messages = await client.getMessages(channel, { ids: [messageId] })

// 2. Usar iterDownload para streaming por chunks
const downloader = client.iterDownload(fileLocation, {
  offset: startByte,
  limit: endByte - startByte + 1,
  requestSize: 1024 * 1024  // 1MB chunks
})

// 3. Soportar Range requests para seek
if (rangeHeader) {
  // Servir solo los bytes solicitados
  // Headers: Content-Range, Accept-Ranges, etc.
}
```

---

## 📡 Sistema de Streaming MTProto

### Endpoint Principal: `/api/stream/:chatId/:videoId`

Este endpoint usa **GramJS (MTProto)** para acceder a archivos de cualquier tamaño, sin el límite de 20MB de Bot API.

```typescript
// Flujo completo del proxy MTProto:

1. Recibir request con chatId y videoId
2. Conectar a Telegram via MTProto (como BOT)
3. Obtener el mensaje y extraer el documento
4. Manejar Range header si existe
5. Usar iterDownload para streaming por chunks
6. Retornar stream con headers correctos
```

### Endpoint Alternativo: `/api/telegram/stream`

Usa parámetros query:
- `?channel=CANAL&messageId=123` - MTProto streaming
- `?link=https://t.me/canal/123` - Parsear link y usar MTProto
- `?file_id=XXX` - Bot API (archivos < 20MB)

### Headers HTTP críticos:

```http
# Request del navegador:
Range: bytes=0-1048575

# Response del proxy:
HTTP/1.1 206 Partial Content
Content-Type: video/mp4
Content-Length: 1048576
Content-Range: bytes 0-1048575/52428800
Accept-Ranges: bytes
Cache-Control: public, max-age=3600
```

### Ventajas:

- ✅ Sin almacenamiento adicional
- ✅ Soporta seek (adelantar/retroceder)
- ✅ Sin límite de tamaño (MTProto)
- ✅ Compatible con todos los navegadores
- ✅ No expone credenciales al frontend

---

## 🎯 Estrategia 2: MP4 FastStart (Recomendado para subir)

### El problema del "moov atom":

```
MP4 TÍPICO (sin faststart):
┌─────────────────────────────────────────────────────┐
│  [datos video]  [datos audio]  [MOOV - metadata]   │
│     (2 horas)      (2 horas)      (índice)          │
└─────────────────────────────────────────────────────┘
                 ▲
                 │ El navegador necesita esto PRIMERO
                 │ para saber la duración y poder hacer seek

MP4 CON FASTSTART:
┌─────────────────────────────────────────────────────┐
│  [MOOV - metadata]  [datos video]  [datos audio]   │
│      (índice)          (2 horas)      (2 horas)     │
└─────────────────────────────────────────────────────┘
     ▲
     │ ¡El navegador lo tiene inmediatamente!
```

### Comando FFmpeg para optimizar:

```bash
# Mover moov atom al inicio (faststart)
ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4

# Optimizar para streaming web
ffmpeg -i input.mp4 \
  -c:v libx264 -preset fast -tune zerolatency \
  -c:a aac -b:a 128k \
  -movflags +faststart+frag_keyframe+empty_moov \
  -f mp4 output_streaming.mp4
```

---

## 🚀 Código Implementado

### 1. MTProto Stream (`/api/stream/[chatId]/[videoId]/route.ts`)

Características implementadas:
- Conexión como BOT (no requiere sesión de usuario)
- Streaming de archivos de cualquier tamaño
- Soporte completo de Range requests
- Chunks de 512KB para estabilidad

### 2. Telegram Stream (`/api/telegram/stream/route.ts`)

Características implementadas:
- Múltiples formatos de entrada (channel/msgId, link, file_id)
- MTProto para archivos grandes
- Bot API fallback para archivos < 20MB
- Detección automática de MIME type

### 3. Reproductor Optimizado (`CoverPlayer.tsx`)

Características implementadas:
- Construcción automática de URL de streaming
- Controles completos (seek, volume, fullscreen)
- Indicadores de estado
- Atajos de teclado
- Sin redirecciones a Telegram

---

## 🔗 Endpoints del Sistema

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/stream/:chatId/:videoId` | GET | Streaming MTProto (principal) |
| `/api/stream/:chatId/:videoId` | HEAD | Obtener metadata |
| `/api/telegram/stream?channel=X&messageId=Y` | GET | Streaming MTProto (query) |
| `/api/telegram/stream?file_id=XXX` | GET | Bot API (< 20MB) |
| `/api/telegram/image?file_id=XXX` | GET | Proxy de imágenes |

---

## 🐛 Troubleshooting

### "No se pudo cargar el video"

1. Verificar que el bot tenga acceso al canal
2. El bot debe ser administrador del canal
3. El mensaje debe contener un video/documento

### "Pantalla negra al inicio"

1. El video no tiene faststart → optimizar con FFmpeg
2. Conexión lenta → el proxy detecta y muestra indicador

### "No puedo hacer seek"

1. Verificar que el proxy retorne `Accept-Ranges: bytes`
2. El video debe tener moov atom al inicio
3. Probar con video optimizado

### "Media is big" error

Este error ocurre con Bot API. Usar el endpoint MTProto:
`/api/stream/:chatId/:videoId` en lugar de `?file_id=`
