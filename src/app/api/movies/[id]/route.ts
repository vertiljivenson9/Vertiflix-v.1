import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
import { DEMO_MOVIES } from '@/lib/data';

// In-memory storage for demo (resets on each deployment)
let movies = [...DEMO_MOVIES];

// GET - Fetch a single movie by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const movie = movies.find(m => m.id === id);

  if (!movie) {
    return NextResponse.json(
      { error: 'Película no encontrada' },
      { status: 404 }
    );
  }

  return NextResponse.json(movie);
}

// PUT - Update a movie
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const index = movies.findIndex(m => m.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Película no encontrada' },
        { status: 404 }
      );
    }

    movies[index] = {
      ...movies[index],
      ...body,
      year: parseInt(body.year) || movies[index].year,
      duration: parseInt(body.duration) || movies[index].duration,
      rating: parseFloat(body.rating) || movies[index].rating,
      updatedAt: new Date(),
    };

    return NextResponse.json(movies[index]);
  } catch {
    return NextResponse.json(
      { error: 'Error al actualizar película' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a movie
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const index = movies.findIndex(m => m.id === id);

  if (index === -1) {
    return NextResponse.json(
      { error: 'Película no encontrada' },
      { status: 404 }
    );
  }

  movies.splice(index, 1);
  return NextResponse.json({ success: true });
}
