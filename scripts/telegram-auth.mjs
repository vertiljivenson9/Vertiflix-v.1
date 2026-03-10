#!/usr/bin/env node
/**
 * Script para autenticar con Telegram
 * 
 * Uso: node scripts/telegram-auth.mjs
 */

import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
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
      process.env[key.trim()] = valueParts.join('=').trim()
    }
  })
}

const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0')
const API_HASH = process.env.TELEGRAM_API_HASH || ''

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (prompt: string): Promise<string> => {
  return new Promise(resolve => rl.question(prompt, resolve))
}

async function main() {
  console.log('🎬 Vertiflix - Autenticación de Telegram\n')
  console.log('API_ID:', API_ID)
  console.log('API_HASH:', API_HASH ? '✅ Configurado' : '❌ Falta')
  console.log('')

  if (!API_ID || !API_HASH) {
    console.error('❌ Error: Configura TELEGRAM_API_ID y TELEGRAM_API_HASH en .env.local')
    rl.close()
    process.exit(1)
  }

  const stringSession = new StringSession('')
  
  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  })

  console.log('🔄 Conectando a Telegram...')
  await client.connect()

  // Solicitar número de teléfono
  const phoneNumber = await question('📱 Ingresa tu número con código de país (ej: +521234567890): ')
  
  try {
    const { phoneCodeHash } = await client.sendCode(
      { apiId: API_ID, apiHash: API_HASH },
      phoneNumber,
      false
    )

    console.log('📨 Código enviado a tu Telegram!')
    const phoneCode = await question('Ingresa el código que recibiste: ')

    try {
      await client.signIn(
        { apiId: API_ID, apiHash: API_HASH },
        phoneNumber,
        phoneCode,
        phoneCodeHash
      )
    } catch (err: unknown) {
      const error = err as { message?: string; className?: string }
      if (error.className === 'SessionPasswordNeededError') {
        const password = await question('🔐 Tu cuenta tiene 2FA. Ingresa tu contraseña: ')
        await client.invoke({
          _: 'account.updatePasswordSettings',
          password: password,
          newSettings: { _: 'account.passwordInputSettings', hint: '' }
        })
      } else {
        throw err
      }
    }

    console.log('\n✅ Autenticación exitosa!')
    
    const sessionString = client.session.save() as unknown as string
    console.log('📝 Tu sesión:', sessionString?.substring(0, 50) + '...')

    // Guardar sesión
    const sessionPath = path.join(__dirname, '..', '.telegram-session')
    fs.writeFileSync(sessionPath, sessionString || '')
    console.log(`💾 Sesión guardada en: ${sessionPath}`)

    // Actualizar .env.local
    let envContent = fs.readFileSync(envPath, 'utf-8')
    if (envContent.includes('TELEGRAM_SESSION=')) {
      envContent = envContent.replace(/TELEGRAM_SESSION=.*/, `TELEGRAM_SESSION=${sessionString}`)
    } else {
      envContent += `\nTELEGRAM_SESSION=${sessionString}`
    }
    fs.writeFileSync(envPath, envContent)
    console.log('📝 .env.local actualizado con la sesión')

    await client.disconnect()
    console.log('\n🎉 ¡Listo! Reinicia tu servidor para usar el scraper.')

  } catch (error) {
    console.error('❌ Error:', error)
  }

  rl.close()
}

main().catch(console.error)
