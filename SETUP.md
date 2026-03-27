# 🎬 Vertiflix - Guía de Configuración

## ✅ Proyecto Configurado

El proyecto está listo para deploy en Vercel con las siguientes credenciales:

### Servicios Configurados:
- ✅ **Firebase** - Base de datos (Firestore)
- ✅ **Telegram Bot** - @VertiflixBot  
- ✅ **Cloudinary** - Almacenamiento de imágenes
- ✅ **Vercel** - Hosting listo

---

## 🚀 Deploy en Vercel

### Paso 1: Subir a GitHub

```bash
cd Vertiflix-v.1
git init
git add .
git commit -m "Vertiflix ready for deploy"
git remote add origin https://github.com/TU_USUARIO/vertiflix.git
git push -u origin main
```

### Paso 2: Importar en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click en "Add New Project"
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente Next.js

### Paso 3: Configurar Variables de Entorno en Vercel

En **Settings > Environment Variables**, agrega:

```
TELEGRAM_BOT_TOKEN=8753727133:AAGpydGYzKsZES01XMSd1PHtrl2LMQiUcss
TELEGRAM_CHANNEL=VertiflixVideos
TELEGRAM_API_ID=37489169
TELEGRAM_API_HASH=fb84f7159273b7237da3e1954ec4cbcd

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyA8ozGUpJDm2Sfo456pHczgFp_QJh8EnhM
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vertilflix-1de79.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=vertilflix-1de79
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=vertilflix-1de79.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=244756273233
NEXT_PUBLIC_FIREBASE_APP_ID=1:244756273233:web:15e3d56c216f599f598070
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-9NB4CE8EVB

FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@vertilflix-1de79.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=(pegar el contenido completo del private_key)

ADMIN_PASSWORD=admin123
```

### Paso 4: Deploy

Click en "Deploy" y espera a que termine.

---

## 📱 Configurar Webhook de Telegram

Después del deploy:

1. Abre tu app: `https://tu-app.vercel.app`
2. Click en el ícono de Admin (arriba a la derecha)
3. Ve a la pestaña "Telegram"
4. En "URL del Webhook" pon:
   ```
   https://tu-app.vercel.app/api/telegram/webhook
   ```
5. Click en el botón de configurar

---

## 🔥 Configurar Firebase (ya listo)

Las colecciones se crean automáticamente:

- `movies` - Películas agregadas manualmente
- `telegram_movies` - Películas del bot
- `bot_sessions` - Sesiones del bot

---

## 🤖 Flujo del Bot

```
Usuario → Bot Telegram
    │
    ├─ /nueva → Inicia proceso
    ├─ Envía VIDEO → Bot reenvía al canal
    ├─ Envía IMAGEN → Poster de la película
    ├─ Escribe TÍTULO → Nombre
    ├─ Escribe AÑO → 2024
    ├─ Selecciona CATEGORÍA → Botones
    └─ ✅ Guardar → Película en Vertiflix
```

---

## 🎥 Reproducción de Videos

1. Usuario hace click en película
2. App obtiene URL directa del CDN de Telegram
3. Video se reproduce sin redirección
4. Controles: play, pause, seek, fullscreen

---

## 📋 Comandos

```bash
# Desarrollo local
bun dev

# Build
bun run build

# Producción
bun start

# Bot de Telegram (opcional, modo polling)
bun run telegram-bot
```

---

## 🔧 Estructura del Proyecto

```
Vertiflix-v.1/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── movies/              # CRUD películas
│   │   │   ├── stream/              # Streaming MTProto
│   │   │   │   └── [chatId]/[videoId]/
│   │   │   └── telegram/
│   │   │       ├── stream/          # Streaming alternativo
│   │   │       ├── webhook/         # Bot webhook
│   │   │       ├── movies/          # Gestión películas
│   │   │       ├── image/           # Proxy imágenes
│   │   │       ├── scrape/          # Scraper canales
│   │   │       └── debug/           # Debug
│   │   ├── page.tsx                 # Página principal
│   │   └── layout.tsx               # Layout
│   ├── components/
│   │   ├── admin/                   # Panel admin
│   │   ├── movies/                  # Cards, modales
│   │   └── player/                  # Reproductor
│   └── lib/
│       ├── firebase.ts              # Config cliente
│       ├── firebase-admin.ts        # Config servidor
│       ├── firebase-db.ts           # Operaciones DB
│       └── telegram-mtproto.ts      # Cliente MTProto
├── .env.local                       # Variables locales
├── vercel.json                      # Config Vercel
└── next.config.ts                   # Config Next.js
```

---

## ⚠️ Importante

1. **Firebase Private Key** - En Vercel, la private key debe ir completa con `\n` literales
2. **Webhook HTTPS** - Telegram requiere HTTPS (Vercel lo proporciona)
3. **Bot Admin del Canal** - El bot debe ser administrador del canal @VertiflixVideos
