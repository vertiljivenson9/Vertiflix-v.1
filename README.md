# Vertiflix - Sistema de Streaming con Telegram

Sistema de streaming tipo Netflix que reproduce videos almacenados en canales de Telegram usando MTProto para archivos de cualquier tamaño.

## 🚀 Características

- **Streaming sin límites**: Usa MTProto (GramJS) para archivos de cualquier tamaño
- **HTTP Range Requests**: Soporte completo para adelantar/retroceder videos
- **Proxy seguro**: El token de Telegram nunca se expone al frontend
- **Fallback automático**: Bot API para archivos < 20MB si MTProto no está disponible
- **UI estilo Netflix**: Interfaz moderna y responsive

## 📋 Requisitos

1. **Telegram Bot Token** - Obtener de [@BotFather](https://t.me/BotFather)
2. **Telegram API credentials** - Obtener de [my.telegram.org](https://my.telegram.org/apps)
3. **Firebase** - Para almacenamiento de metadatos de películas

## ⚡ Inicio Rápido

```bash
# Clonar e instalar
cd vertiflix
bun install

# Configurar variables de entorno (ver .env.local)

# Autenticar MTProto (para archivos grandes)
bun run telegram-auth

# Iniciar desarrollo
bun dev
```

## 🔧 Configuración

### 1. Variables de Entorno

Crear archivo `.env.local` con:

```env
# Telegram Bot (obtener de @BotFather)
TELEGRAM_BOT_TOKEN=tu_bot_token

# Telegram API (obtener de my.telegram.org/apps)
TELEGRAM_API_ID=tu_api_id
TELEGRAM_API_HASH=tu_api_hash

# Sesión MTProto (se genera con telegram-auth)
TELEGRAM_SESSION=

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

### 2. Autenticación MTProto

Para streaming de archivos grandes (>20MB), necesitas autenticar tu cuenta:

```bash
bun run telegram-auth
```

Sigue las instrucciones:
1. Ingresa tu número de teléfono con código de país (ej: +521234567890)
2. Ingresa el código que recibes en Telegram
3. La sesión se guarda automáticamente

## 📡 Endpoints de Streaming

### Nuevo Sistema MTProto

```
GET /api/telegram/stream?channel=CANAL&messageId=123
GET /api/telegram/stream?link=https://t.me/channel/123
GET /api/telegram/stream?file_id=ABC123
```

### Características

| Característica | MTProto | Bot API |
|---------------|---------|---------|
| Tamaño máximo | Sin límite | 20MB |
| Range Requests | ✅ | ✅ |
| Seek/Adelantar | ✅ | ✅ |
| Requiere auth | Sí | No |

## 🏗️ Arquitectura

```
┌─────────────┐     Range Request     ┌──────────────────┐
│  Navegador  │ ◄──────────────────► │  Backend Next.js │
│  <video>    │                       │  (Proxy Stream)  │
└─────────────┘                       └────────┬─────────┘
                                               │
                                    ┌──────────┴──────────┐
                                    │                     │
                                    ▼                     ▼
                           ┌───────────────┐    ┌───────────────┐
                           │ MTProto/GramJS│    │   Bot API     │
                           │ (Sin límite)  │    │  (< 20MB)     │
                           └───────┬───────┘    └───────┬───────┘
                                   │                    │
                                   └────────┬───────────┘
                                            ▼
                                   ┌───────────────┐
                                   │ Telegram DC   │
                                   │ (Videos MP4)  │
                                   └───────────────┘
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   └── api/
│       ├── telegram/
│       │   ├── stream/       # Endpoint streaming MTProto
│       │   ├── video/        # Endpoint Bot API
│       │   └── webhook/      # Webhook del bot
│       └── stream/[id]/      # Info de películas
├── components/
│   ├── player/
│   │   └── StreamPlayer.tsx  # Reproductor HTML5
│   └── ...
└── lib/
    ├── telegram-mtproto.ts   # Módulo MTProto
    └── ...
```

## 🎬 Flujo de Streaming

1. Usuario hace clic en una película
2. StreamPlayer solicita info a `/api/stream/[id]`
3. Si hay datos MTProto → usa `/api/telegram/stream`
4. Si hay file_id → usa Bot API como fallback
5. Video se reproduce con soporte de Range Requests

## 🔐 Seguridad

- El token de Telegram **nunca** se expone al frontend
- El backend actúa como proxy para todas las peticiones
- Los file_ids son públicos pero no permiten acceso sin el token

## 📝 Comandos

```bash
bun dev              # Desarrollo
bun run build        # Build producción
bun run start        # Iniciar producción
bun run telegram-auth # Autenticar MTProto
bun run telegram-bot # Iniciar bot de Telegram
```

## ⚠️ Limitaciones

1. **MTProto requiere autenticación**: Debes autenticar tu cuenta personal
2. **Ancho de banda doble**: El servidor actúa como proxy
3. **Rate limits**: Telegram tiene límites de velocidad
4. **Moov atom**: Videos sin faststart pueden tardar en iniciar

## 🛠️ Optimización de Videos

Para mejor streaming, optimiza los videos antes de subir:

```bash
ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4
```

## 📄 Licencia

MIT
