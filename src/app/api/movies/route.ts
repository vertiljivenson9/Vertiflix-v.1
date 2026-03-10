import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
import { DEMO_MOVIES } from '@/lib/data';

// In-memory storage for demo (resets on each deployment)
let movies = [...DEMO_MOVIES];

// GET - Fetch all movies
export async function GET() {
  return NextResponse.json(movies);
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

    const newMovie = {
      id: `movie-${Date.now()}`,
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    movies.unshift(newMovie);
    return NextResponse.json(newMovie, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error al crear película' },
      { status: 500 }
    );
  }
}
