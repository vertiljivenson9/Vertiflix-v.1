import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Pre-defined translations for subtitles
const TRANSLATIONS: Record<string, Record<string, string[]>> = {
  'es-en': {
    'Esta es una película increíble...': 'This is an amazing movie...',
    'Los actores hacen un gran trabajo.': 'The actors do a great job.',
    'El final te sorprenderá.': 'The ending will surprise you.',
    'Una obra maestra del cine.': 'A masterpiece of cinema.'
  },
  'es-fr': {
    'Esta es una película increíble...': "C'est un film incroyable...",
    'Los actores hacen un gran trabajo.': 'Les acteurs font un excellent travail.',
    'El final te sorprenderá.': 'La fin vous surprendra.',
    'Una obra maestra del cine.': "Un chef-d'œuvre du cinéma."
  },
  'en-es': {
    'This is an amazing movie...': 'Esta es una película increíble...',
    'The actors do a great job.': 'Los actores hacen un gran trabajo.',
    'The ending will surprise you.': 'El final te sorprenderá.',
    'A masterpiece of cinema.': 'Una obra maestra del cine.'
  },
  'en-fr': {
    'This is an amazing movie...': "C'est un film incroyable...",
    'The actors do a great job.': 'Les acteurs font un excellent travail.',
    'The ending will surprise you.': 'La fin vous surprendra.',
    'A masterpiece of cinema.': "Un chef-d'œuvre du cinéma."
  },
  'fr-es': {
    "C'est un film incroyable...": 'Esta es una película increíble...',
    'Les acteurs font un excellent travail.': 'Los actrices hacen un gran trabajo.',
    'La fin vous surprendra.': 'El final te sorprenderá.',
    "Un chef-d'œuvre du cinéma.": 'Una obra maestra del cine.'
  },
  'fr-en': {
    "C'est un film incroyable...": 'This is an amazing movie...',
    'Les acteurs font un excellent travail.': 'The actors do a great job.',
    'La fin vous surprendra.': 'The ending will surprise you.',
    "Un chef-d'œuvre du cinéma.": 'A masterpiece of cinema.'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, from, to } = await request.json()

    if (!text || !from || !to) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    if (from === to) {
      return NextResponse.json({ translated: text })
    }

    const key = `${from}-${to}`
    const translations = TRANSLATIONS[key]
    
    if (translations && translations[text]) {
      return NextResponse.json({ translated: translations[text] })
    }

    // Fallback: return original text
    return NextResponse.json({ translated: text })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ error: 'Error al traducir' }, { status: 500 })
  }
}
