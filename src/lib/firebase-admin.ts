// Firebase Admin Configuration (Server-side only)
import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getStorage, Storage } from 'firebase-admin/storage'

let adminApp: App | null = null
let adminDb: Firestore | null = null
let adminStorage: Storage | null = null

// Solo inicializar en el servidor
function getAdminApp(): App {
  if (adminApp) return adminApp
  
  if (getApps().length > 0) {
    adminApp = getApps()[0]
    return adminApp
  }

  // Parsear la private key del service account
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  
  if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    throw new Error('Firebase Admin credentials not configured')
  }

  adminApp = initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })

  return adminApp
}

// Obtener instancia de Firestore Admin
export function getAdminDb(): Firestore {
  if (adminDb) return adminDb
  getAdminApp()
  adminDb = getFirestore()
  return adminDb
}

// Obtener instancia de Storage Admin
export function getFirebaseStorage(): Storage {
  if (adminStorage) return adminStorage
  getAdminApp()
  adminStorage = getStorage()
  return adminStorage
}

export { getAdminApp }
