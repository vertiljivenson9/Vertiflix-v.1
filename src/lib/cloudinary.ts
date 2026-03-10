// Configuración de Cloudinary para upload de imágenes

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo'

export const CLOUDINARY_CONFIG = {
  cloudName: CLOUDINARY_CLOUD_NAME,
  uploadPreset: 'vertiflix-uploads', // Crear en Cloudinary Dashboard > Settings > Upload
  folder: 'vertiflix/thumbnails',
}

// URL para subir imágenes
export const getCloudinaryUploadUrl = () => {
  return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`
}

// Generar URL optimizada para thumbnails
export const getOptimizedUrl = (publicId: string, width: number = 500) => {
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/w_${width},c_fill,q_auto,f_auto/${publicId}`
}

// Extraer public_id de una URL de Cloudinary
export const extractPublicId = (url: string): string | null => {
  if (!url.includes('cloudinary.com')) return null
  const parts = url.split('/')
  const uploadIndex = parts.findIndex(p => p === 'upload')
  if (uploadIndex === -1) return null
  // Obtener todo después de 'upload/' y remover la versión si existe
  let publicId = parts.slice(uploadIndex + 1).join('/')
  // Remover extensión
  publicId = publicId.replace(/\.[^/.]+$/, '')
  return publicId
}

// Función para subir imagen (client-side)
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset)
  formData.append('folder', CLOUDINARY_CONFIG.folder)

  const response = await fetch(getCloudinaryUploadUrl(), {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Error al subir imagen a Cloudinary')
  }

  const data = await response.json()
  return data.secure_url
}

// Función para subir imagen desde URL
export async function uploadFromUrl(imageUrl: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', imageUrl)
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset)
  formData.append('folder', CLOUDINARY_CONFIG.folder)

  const response = await fetch(getCloudinaryUploadUrl(), {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Error al subir imagen a Cloudinary')
  }

  const data = await response.json()
  return data.secure_url
}

// Nota: Para usar Cloudinary, necesitas:
// 1. Crear cuenta gratuita en https://cloudinary.com
// 2. Obtener tu cloud_name del Dashboard
// 3. Crear un upload preset en Settings > Upload > Add upload preset
//    - Nombre: "vertiflix-uploads"
//    - Signing Mode: Unsigned
//    - Folder: vertiflix/thumbnails
