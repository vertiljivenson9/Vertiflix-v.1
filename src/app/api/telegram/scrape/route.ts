import { NextRequest, NextResponse } from 'next/server'
import { scrapeTelegramChannel } from '@/lib/telegram-scraper'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { channelUrl, limit = 20, adminPassword } = body

    // Validar contraseña de admin
    const validPassword = process.env.ADMIN_PASSWORD || 'admin123'
    if (adminPassword !== validPassword) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    if (!channelUrl) {
      return NextResponse.json({ error: 'URL de canal requerida' }, { status: 400 })
    }

    const result = await scrapeTelegramChannel(channelUrl, limit)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error scraping Telegram:', error)
    return NextResponse.json({ error: 'Error al scrapear canal' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const channelUrl = searchParams.get('channel')
  const limit = parseInt(searchParams.get('limit') || '10')
  
  if (!channelUrl) {
    return NextResponse.json({ error: 'URL de canal requerida' }, { status: 400 })
  }

  const result = await scrapeTelegramChannel(channelUrl, limit)
  return NextResponse.json(result)
}
