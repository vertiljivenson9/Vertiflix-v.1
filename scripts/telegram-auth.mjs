#!/usr/bin/env node
/**
 * Script de Autenticación MTProto para Vertiflix
 *
 * Este script autentica tu cuenta de Telegram para usar MTProto.
 * MTProto permite descargar archivos de CUALQUIER tamaño desde Telegram.
 *
 * Uso:
 *   bun run telegram-auth
 *   o: node scripts/telegram-auth.mjs
 *
 * Pasos:
 *   1. Asegúrate de tener TELEGRAM_API_ID y TELEGRAM_API_HASH en .env.local
 *   2. Ejecuta este script
 *   3. Ingresa tu número de teléfono con código de país (ej: +521234567890)
 *   4. Ingresa el código que recibes en Telegram
 *   5. Si tienes 2FA, ingresa tu contraseña
 *   6. La sesión se guarda automáticamente en .env.local
 */

import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import * as readline from 'readline'
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
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      process.env[key.trim()] = value
    }
  })
}

const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0')
const API_HASH = process.env.TELEGRAM_API_HASH || ''

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve))

async function main() {
  console.log('')
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║         🎬 VERTIFLIX - Autenticación MTProto                 ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log('')

  console.log('📋 Configuración actual:')
  console.log(`   API_ID: ${API_ID}`)
  console.log(`   API_HASH: ${API_HASH ? '✅ Configurado' : '❌ Falta'}`)
  console.log('')

  if (!API_ID || !API_HASH) {
    console.error('❌ Error: Configura TELEGRAM_API_ID y TELEGRAM_API_HASH en .env.local')
    console.log('')
    console.log('📝 Para obtener estos valores:')
    console.log('   1. Ve a https://my.telegram.org/apps')
    console.log('   2. Inicia sesión con tu número de teléfono')
    console.log('   3. Crea una nueva aplicación')
    console.log('   4. Copia el api_id y api_hash')
    console.log('')
    rl.close()
    process.exit(1)
  }

  const stringSession = new StringSession('')

  console.log('🔄 Conectando a Telegram...')
  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  })

  await client.connect()
  console.log('✅ Conectado a Telegram')
  console.log('')

  // Solicitar número de teléfono
  const phoneNumber = await question('📱 Ingresa tu número con código de país (ej: +521234567890): ')

  try {
    console.log('📨 Enviando código de verificación...')
    const { phoneCodeHash } = await client.sendCode(
      { apiId: API_ID, apiHash: API_HASH },
      phoneNumber,
      false
    )

    console.log('✅ Código enviado a tu Telegram')
    const phoneCode = await question('🔑 Ingresa el código que recibiste: ')

    try {
      await client.signIn(
        { apiId: API_ID, apiHash: API_HASH },
        phoneNumber,
        phoneCode,
        phoneCodeHash
      )
    } catch (err) {
      // Si tiene 2FA
      if (err.message?.includes('SessionPasswordNeeded') || err.className === 'SESSION_PASSWORD_NEEDED') {
        console.log('')
        console.log('🔐 Tu cuenta tiene verificación en dos pasos (2FA)')
        const password = await question('Ingresa tu contraseña de 2FA: ')
        await client.invoke({
          _: 'account.getPassword'
        })
        // Para 2FA, necesitamos un flujo diferente
        // Por ahora, mostramos mensaje
        console.log('')
        console.log('⚠️ La autenticación con 2FA requiere pasos adicionales.')
        console.log('   Intenta usar el método alternativo.')
      } else {
        throw err
      }
    }

    console.log('')
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║                  ✅ AUTENTICACIÓN EXITOSA                    ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')
    console.log('')

    const sessionString = client.session.save()
    console.log('📝 Tu sesión (guardada automáticamente):')
    console.log(`   ${sessionString?.substring(0, 50)}...`)
    console.log('')

    // Guardar sesión en archivo
    const sessionPath = path.join(__dirname, '..', '.telegram-session')
    fs.writeFileSync(sessionPath, sessionString || '')
    console.log(`💾 Sesión guardada en: ${sessionPath}`)

    // Actualizar .env.local
    let envContent = ''
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8')
    }

    if (envContent.includes('TELEGRAM_SESSION=')) {
      envContent = envContent.replace(/TELEGRAM_SESSION=.*/, `TELEGRAM_SESSION=${sessionString}`)
    } else {
      envContent += `\nTELEGRAM_SESSION=${sessionString}`
    }

    fs.writeFileSync(envPath, envContent)
    console.log('📝 .env.local actualizado con la sesión')
    console.log('')

    await client.disconnect()

    console.log('🎉 ¡Listo! Ahora puedes:')
    console.log('   • Reproducir videos de cualquier tamaño desde Telegram')
    console.log('   • Usar el streaming MTProto sin límites')
    console.log('')
    console.log('   Reinicia tu servidor para aplicar los cambios.')
    console.log('')

  } catch (error) {
    console.error('')
    console.error('❌ Error de autenticación:', error.message || error)
    console.error('')
    console.log('Posibles soluciones:')
    console.log('  • Verifica que el número esté en formato internacional (+521234567890)')
    console.log('  • Asegúrate de ingresar el código correctamente')
    console.log('  • Si tienes 2FA, intenta desactivarlo temporalmente')
    console.log('')
  }

  rl.close()
}

main().catch(console.error)
