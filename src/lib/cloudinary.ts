// Cloudinary - Unsigned Upload
// Documentación: https://cloudinary.com/documentation/upload_images

const CLOUD_NAME = 'dcclzhsim'
const UPLOAD_PRESET = 'community_hub'

export async function uploadImage(file: File): Promise<string> {
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Error al subir imagen')
  }

  return data.secure_url
}

export const CLOUDINARY_CONFIG = {
  cloudName: CLOUD_NAME,
  uploadPreset: UPLOAD_PRESET,
}
