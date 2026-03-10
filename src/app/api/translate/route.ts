import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'edge'

const LANGUAGES: Record<string, string> = {
  es: 'español',
  en: 'inglés', 
  fr: 'francés'
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

    const zai = await ZAI.create()
    
    const prompt = `Traduce de ${LANGUAGES[from]} a ${LANGUAGES[to]}: "${text}"`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Traductor de subtítulos. Responde SOLO con la traducción.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 200
    })

    const translated = completion.choices[0]?.message?.content?.trim() || text

    return NextResponse.json({ translated })
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json({ error: 'Error al traducir' }, { status: 500 })
  }
}
