// Firebase Database Operations - Cliente + Admin fallback
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore'
import { db } from './firebase'

// Colecciones
const MOVIES_COLLECTION = 'movies'
const TELEGRAM_MOVIES_COLLECTION = 'telegram_movies'
const BOT_SESSIONS_COLLECTION = 'bot_sessions'

// =====================================================
// SESIONES DEL BOT (usando cliente Firebase + memoria)
// =====================================================

// Backup en memoria para sesiones
const memorySessions = new Map<number, Record<string, unknown>>()

export async function getSession(chatId: number): Promise<Record<string, unknown> | null> {
  // Siempre intentar memoria primero (más rápido)
  const memSession = memorySessions.get(chatId)
  if (memSession) return memSession
  
  // Intentar Firebase
  try {
    const q = query(
      collection(db, BOT_SESSIONS_COLLECTION),
      where('chat_id', '==', chatId),
      limit(1)
    )
    const snapshot = await getDocs(q)
    
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data()
      const session = { id: snapshot.docs[0].id, ...data }
      // Guardar en memoria para下次
      memorySessions.set(chatId, session as Record<string, unknown>)
      return session as Record<string, unknown>
    }
  } catch (error) {
    console.log('Firebase session read failed, using memory:', error)
  }
  
  return null
}

export async function saveSession(chatId: number, data: Record<string, unknown>): Promise<void> {
  // Siempre guardar en memoria
  memorySessions.set(chatId, { chat_id: chatId, ...data, updated_at: new Date() })
  
  // Intentar guardar en Firebase
  try {
    const existing = await getSession(chatId)
    
    if (existing?.id) {
      // Actualizar
      await updateDoc(doc(db, BOT_SESSIONS_COLLECTION, existing.id as string), {
        ...data,
        updated_at: Timestamp.now()
      })
    } else {
      // Crear nuevo
      await addDoc(collection(db, BOT_SESSIONS_COLLECTION), {
        chat_id: chatId,
        ...data,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      })
    }
  } catch (error) {
    console.log('Firebase session save failed, memory only:', error)
  }
}

export async function clearSession(chatId: number): Promise<void> {
  // Siempre limpiar memoria
  memorySessions.delete(chatId)
  
  // Intentar limpiar Firebase
  try {
    const existing = await getSession(chatId)
    if (existing?.id) {
      await deleteDoc(doc(db, BOT_SESSIONS_COLLECTION, existing.id as string))
    }
  } catch (error) {
    console.log('Firebase session clear failed:', error)
  }
}

// =====================================================
// PELÍCULAS DE TELEGRAM
// =====================================================

export async function addTelegramMovie(movie: Record<string, unknown>): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, TELEGRAM_MOVIES_COLLECTION), {
      ...movie,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding telegram movie:', error)
    return null
  }
}

export async function getTelegramMovies(approved: boolean | null = null): Promise<Record<string, unknown>[]> {
  try {
    let q
    if (approved === null) {
      // Get all movies
      q = query(collection(db, TELEGRAM_MOVIES_COLLECTION), limit(100))
    } else {
      // Get by approval status
      q = query(
        collection(db, TELEGRAM_MOVIES_COLLECTION),
        where('approved', '==', approved),
        limit(100)
      )
    }
    const snapshot = await getDocs(q)
    const movies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    // Sort by created_at desc manually
    return movies.sort((a, b) => {
      const aTime = (a.created_at as { seconds?: number })?.seconds || 0
      const bTime = (b.created_at as { seconds?: number })?.seconds || 0
      return bTime - aTime
    })
  } catch (error) {
    console.error('Error getting telegram movies:', error)
    return []
  }
}

// =====================================================
// TODAS LAS PELÍCULAS (locales + telegram)
// =====================================================

export async function getAllMovies(): Promise<Record<string, unknown>[]> {
  const movies: Record<string, unknown>[] = []
  
  try {
    // Películas locales
    const localSnapshot = await getDocs(collection(db, MOVIES_COLLECTION))
    localSnapshot.docs.forEach(doc => {
      const data = doc.data()
      movies.push({
        id: doc.id,
        ...data,
        videoUrl: data.video_url,
        source: 'local'
      })
    })
    
    // Películas de Telegram
    const telegramSnapshot = await getDocs(
      query(collection(db, TELEGRAM_MOVIES_COLLECTION), where('approved', '==', true))
    )
    telegramSnapshot.docs.forEach(doc => {
      const data = doc.data()
      movies.push({
        id: doc.id,
        ...data,
        videoUrl: data.video_url,
        fileId: data.file_id,
        telegramLink: data.telegram_link,
        channelMessageId: data.channel_message_id,
        source: 'telegram'
      })
    })
  } catch (error) {
    console.error('Error getting all movies:', error)
  }
  
  return movies
}

export async function addMovie(movie: Record<string, unknown>): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, MOVIES_COLLECTION), {
      ...movie,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    })
    return docRef.id
  } catch (error) {
    console.error('Error adding movie:', error)
    return null
  }
}

export async function deleteMovie(id: string, table: 'movies' | 'telegram_movies' = 'telegram_movies'): Promise<boolean> {
  try {
    await deleteDoc(doc(db, table === 'movies' ? MOVIES_COLLECTION : TELEGRAM_MOVIES_COLLECTION, id))
    return true
  } catch (error) {
    console.error('Error deleting movie:', error)
    return false
  }
}

export async function getMovieById(movieId: string): Promise<Record<string, unknown> | null> {
  try {
    const docRef = doc(db, TELEGRAM_MOVIES_COLLECTION, movieId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() }
    }
    return null
  } catch (error) {
    console.error('Error getting movie:', error)
    return null
  }
}

export async function updateTelegramMovie(id: string, data: Record<string, unknown>): Promise<boolean> {
  try {
    await updateDoc(doc(db, TELEGRAM_MOVIES_COLLECTION, id), {
      ...data,
      updated_at: Timestamp.now()
    })
    return true
  } catch (error) {
    console.error('Error updating telegram movie:', error)
    return false
  }
}

export async function approveTelegramMovie(id: string): Promise<boolean> {
  return updateTelegramMovie(id, { approved: true })
}

export async function deleteTelegramMovie(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, TELEGRAM_MOVIES_COLLECTION, id))
    return true
  } catch (error) {
    console.error('Error deleting telegram movie:', error)
    return false
  }
}
