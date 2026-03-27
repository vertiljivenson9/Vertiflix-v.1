import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

export const runtime = 'nodejs'
export const maxDuration = 30

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

// Inicializar Firebase Admin
let db: ReturnType<typeof getFirestore> | null = null

function getDb() {
  if (!db) {
    if (getApps().length === 0) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      })
    }
    db = getFirestore()
  }
  return db
}

// GET - Obtener películas de Telegram
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // 'pending', 'approved', 'all'
  
  try {
    const database = getDb()
    
    let snapshot
    if (status === 'pending') {
      snapshot = await database
        .collection('telegram_movies')
        .where('approved', '==', false)
        .limit(100)
        .get()
    } else if (status === 'approved') {
      snapshot = await database
        .collection('telegram_movies')
        .where('approved', '==', true)
        .limit(100)
        .get()
    } else {
      snapshot = await database
        .collection('telegram_movies')
        .limit(100)
        .get()
    }
    
    const movies = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Asegurar que thumbnail tenga un valor
        thumbnail: data.thumbnail || data.image_url || `https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg`,
        // Incluir image_file_id para el proxy
        image_file_id: data.image_file_id || null,
        // ✅ Mapear campos de Telegram para streaming MTProto
        channelUsername: data.channel_username || null,
        channelMessageId: data.channel_message_id || null,
        // Convertir timestamps a formato serializable
        created_at: data.created_at?.toDate ? data.created_at.toDate() : data.created_at,
        updated_at: data.updated_at?.toDate ? data.updated_at.toDate() : data.updated_at
      }
    })
    
    // Ordenar por created_at descendente
    movies.sort((a: any, b: any) => {
      const aTime = a.created_at?.seconds || new Date(a.created_at)?.getTime() || 0
      const bTime = b.created_at?.seconds || new Date(b.created_at)?.getTime() || 0
      return bTime - aTime
    })
    
    return NextResponse.json({ ok: true, movies })
  } catch (error) {
    console.error('Error getting telegram movies:', error)
    return NextResponse.json({ ok: false, error: 'Error al obtener películas', movies: [] }, { status: 500 })
  }
}

// POST - Aprobar o actualizar película
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    const database = getDb()
    const { action, movieId, data } = body
    
    if (action === 'approve' && movieId) {
      await database.collection('telegram_movies').doc(movieId).update({
        approved: true,
        approved_at: new Date(),
        updated_at: new Date()
      })
      return NextResponse.json({ ok: true })
    }
    
    if (action === 'update' && movieId && data) {
      await database.collection('telegram_movies').doc(movieId).update({
        ...data,
        updated_at: new Date()
      })
      return NextResponse.json({ ok: true })
    }
    
    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

// DELETE - Eliminar película
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const movieId = searchParams.get('id')
  const password = searchParams.get('password')
  
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  if (!movieId) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  }
  
  try {
    const database = getDb()
    await database.collection('telegram_movies').doc(movieId).delete()
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting movie:', error)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
