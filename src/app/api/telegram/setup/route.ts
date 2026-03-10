import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

// GET - Obtener info del webhook actual
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')
  
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'BOT_TOKEN no configurado' }, { status: 500 })
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`)
    const data = await response.json()
    
    return NextResponse.json({
      ok: true,
      webhookInfo: data.result
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error obteniendo info del webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - Configurar webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhookUrl, password } = body
    
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    
    if (!BOT_TOKEN) {
      return NextResponse.json({ error: 'BOT_TOKEN no configurado' }, { status: 500 })
    }
    
    if (!webhookUrl) {
      return NextResponse.json({ error: 'webhookUrl requerido' }, { status: 400 })
    }
    
    // Configurar el webhook
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message', 'channel_post', 'edited_message', 'edited_channel_post']
      })
    })
    
    const data = await response.json()
    
    if (data.ok) {
      return NextResponse.json({
        ok: true,
        message: 'Webhook configurado exitosamente',
        webhookUrl,
        result: data.result
      })
    } else {
      return NextResponse.json({
        error: 'Error configurando webhook',
        details: data.description
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error configurando webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - Eliminar webhook
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const password = searchParams.get('password')
  
  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'BOT_TOKEN no configurado' }, { status: 500 })
  }
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`)
    const data = await response.json()
    
    return NextResponse.json({
      ok: true,
      message: 'Webhook eliminado',
      result: data.result
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error eliminando webhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
