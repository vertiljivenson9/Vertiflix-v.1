import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

// Credenciales del admin (desde variables de entorno)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || ''

// Hash de la contraseña para comparar
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// POST - Login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body
    
    // Verificar email
    if (email !== ADMIN_EMAIL) {
      return NextResponse.json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      }, { status: 401 })
    }
    
    // Verificar contraseña (comparar hashes)
    const passwordHash = hashPassword(password)
    if (passwordHash !== ADMIN_PASSWORD_HASH) {
      return NextResponse.json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      }, { status: 401 })
    }
    
    // Crear token simple
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000) // 24 horas
    
    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      admin: {
        email: ADMIN_EMAIL
      }
    })
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error del servidor' 
    }, { status: 500 })
  }
}

// GET - Verificar token
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ 
      authenticated: false,
      error: 'No autorizado' 
    }, { status: 401 })
  }
  
  const token = authHeader.replace('Bearer ', '')
  
  if (token.length < 10) {
    return NextResponse.json({ 
      authenticated: false 
    }, { status: 401 })
  }
  
  return NextResponse.json({ 
    authenticated: true,
    admin: {
      email: ADMIN_EMAIL
    }
  })
}

// DELETE - Logout
export async function DELETE() {
  return NextResponse.json({ 
    success: true,
    message: 'Sesión cerrada' 
  })
}
