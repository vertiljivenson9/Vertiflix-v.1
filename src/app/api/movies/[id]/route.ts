import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch a single movie by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const movie = await db.movie.findUnique({
      where: { id },
    });

    if (!movie) {
      return NextResponse.json(
        { error: 'Película no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(movie);
  } catch (error) {
    console.error('Error fetching movie:', error);
    return NextResponse.json(
      { error: 'Error al obtener película' },
      { status: 500 }
    );
  }
}

// PUT - Update a movie
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const movie = await db.movie.update({
      where: { id },
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

    return NextResponse.json(movie);
  } catch (error) {
    console.error('Error updating movie:', error);
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
  try {
    const { id } = await params;
    await db.movie.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting movie:', error);
    return NextResponse.json(
      { error: 'Error al eliminar película' },
      { status: 500 }
    );
  }
}
