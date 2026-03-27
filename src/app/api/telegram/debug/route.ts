import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    steps: []
  }

  try {
    // Paso 1: Verificar variables de entorno
    results.steps.push({
      step: 'env_check',
      hasBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
      hasFirebaseProject: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasFirebaseEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasFirebaseKey: !!process.env.FIREBASE_PRIVATE_KEY,
      keyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0
    })

    // Paso 2: Inicializar Firebase Admin
    let db
    try {
      if (getApps().length === 0) {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        results.steps.push({
          step: 'firebase_init',
          privateKeyFormat: privateKey?.substring(0, 50) + '...',
          keyHasNewlines: privateKey?.includes('\n')
        })
        
        initializeApp({
          credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
        })
      }
      db = getFirestore()
      results.steps.push({ step: 'firebase_init', status: 'success' })
    } catch (e: any) {
      results.steps.push({ step: 'firebase_init', status: 'error', error: e.message })
      return NextResponse.json(results)
    }

    // Paso 3: Leer sesiones
    try {
      const sessionsSnap = await db.collection('bot_sessions').limit(5).get()
      results.steps.push({
        step: 'read_sessions',
        status: 'success',
        count: sessionsSnap.size,
        sessions: sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      })
    } catch (e: any) {
      results.steps.push({ step: 'read_sessions', status: 'error', error: e.message })
    }

    // Paso 4: Crear sesión de prueba
    const testChatId = Date.now()
    try {
      const ref = await db.collection('bot_sessions').add({
        chat_id: testChatId,
        step: 'test_step',
        created_at: new Date(),
        test: true
      })
      results.steps.push({
        step: 'create_session',
        status: 'success',
        docId: ref.id,
        testChatId
      })

      // Leer la sesión creada
      const snap = await db.collection('bot_sessions').where('chat_id', '==', testChatId).limit(1).get()
      results.steps.push({
        step: 'read_created_session',
        status: snap.empty ? 'not_found' : 'found',
        data: snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
      })

      // Eliminar sesión de prueba
      await ref.delete()
      results.steps.push({ step: 'delete_session', status: 'success' })
    } catch (e: any) {
      results.steps.push({ step: 'session_operations', status: 'error', error: e.message })
    }

    // Paso 5: Verificar películas de telegram
    try {
      const moviesSnap = await db.collection('telegram_movies').limit(5).get()
      results.steps.push({
        step: 'read_movies',
        status: 'success',
        count: moviesSnap.size
      })
    } catch (e: any) {
      results.steps.push({ step: 'read_movies', status: 'error', error: e.message })
    }

  } catch (e: any) {
    results.error = e.message
  }

  return NextResponse.json(results)
}
