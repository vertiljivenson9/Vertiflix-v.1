import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

// Proxy para imágenes de Telegram - evita exponer el token y soluciona CORS
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('file_id')
  
  if (!fileId) {
    return NextResponse.json({ error: 'file_id requerido' }, { status: 400 })
  }
  
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'Bot token no configurado' }, { status: 500 })
  }
  
  try {
    // 1. Obtener file_path de Telegram
    const fileUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
    const fileRes = await fetch(fileUrl)
    const fileData = await fileRes.json()
    
    if (!fileData.ok || !fileData.result?.file_path) {
      console.error('Telegram getFile error:', fileData)
      return NextResponse.redirect('https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg')
    }
    
    // 2. Obtener la imagen
    const imagePath = fileData.result.file_path
    const imageUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${imagePath}`
    
    const imageRes = await fetch(imageUrl)
    
    if (!imageRes.ok) {
      console.error('Telegram image fetch error:', imageRes.status)
      return NextResponse.redirect('https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg')
    }
    
    // 3. Devolver la imagen con headers apropiados
    const imageBuffer = await imageRes.arrayBuffer()
    const contentType = imageRes.headers.get('content-type') || 'image/jpeg'
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache 24 horas
        'Access-Control-Allow-Origin': '*',
      },
    })
    
  } catch (error) {
    console.error('Image proxy error:', error)
    return NextResponse.redirect('https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg')
  }
}
