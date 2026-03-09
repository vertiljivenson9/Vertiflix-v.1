import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all movies
export async function GET() {
  try {
    const movies = await db.movie.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json(
      { error: 'Error al obtener películas' },
      { status: 500 }
    );
  }
}

// POST - Create a new movie
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      thumbnail,
      videoUrl,
      category,
      year,
      duration,
      rating,
      featured,
      language,
    } = body;

    if (!title || !thumbnail || !videoUrl || !category || !year || !duration) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const movie = await db.movie.create({
      data: {
        title,
        description: description || null,
        thumbnail,
        videoUrl,
        category,
        year: parseInt(year),
        duration: parseInt(duration),
        rating: parseFloat(rating) || 0,
        featured: featured || false,
        language: language || 'Español',
      },
    });

    return NextResponse.json(movie, { status: 201 });
  } catch (error) {
    console.error('Error creating movie:', error);
    return NextResponse.json(
      { error: 'Error al crear película' },
      { status: 500 }
    );
  }
}
