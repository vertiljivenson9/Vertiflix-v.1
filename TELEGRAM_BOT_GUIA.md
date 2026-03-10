# 🤖 Guía: Crear Bot de Telegram para Vertiflix

## Paso 1: Crear el Bot en Telegram

1. Abre **@BotFather** en Telegram
2. Envía: `/newbot`
3. Escribe el nombre: `Vertiflix Bot`
4. Escribe el username: `VertiflixBot` (o el que esté disponible)
5. **Copia el TOKEN** que te da (ej: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

## Paso 2: Agregar el Token al .env.local

```
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

## Paso 3: Usar el Bot

1. Busca tu bot en Telegram: `@TuVertiflixBot`
2. Envía: `/start`
3. Envía el enlace del canal: `https://t.me/nombre_canal`
4. El bot te devuelve las películas encontradas

## Notas Importantes

- El bot SOLO puede leer canales PÚBLICOS
- Para canales privados, necesitas ser miembro
- El bot tiene límite de velocidad (no spamees)
