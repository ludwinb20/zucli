import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/tags/[id] - Obtener un tag por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const tag = await prisma.tag.findUnique({
      where: { id }
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag no encontrado' }, { status: 404 });
    }

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error fetching tag:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/tags/[id] - Actualizar un tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role.name !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    // Verificar que el tag existe
    const existingTag = await prisma.tag.findUnique({
      where: { id }
    });

    if (!existingTag) {
      return NextResponse.json({ error: 'Tag no encontrado' }, { status: 404 });
    }

    // Verificar que el nombre no esté duplicado (si se está cambiando)
    if (name && name !== existingTag.name) {
      const duplicateTag = await prisma.tag.findUnique({
        where: { name }
      });

      if (duplicateTag) {
        return NextResponse.json(
          { error: 'Ya existe un tag con ese nombre' },
          { status: 400 }
        );
      }
    }

    // Actualizar el tag
    const updatedTag = await prisma.tag.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      }
    });

    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error('Error updating tag:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/tags/[id] - Eliminar un tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role.name !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que el tag existe
    const existingTag = await prisma.tag.findUnique({
      where: { id }
    });

    if (!existingTag) {
      return NextResponse.json({ error: 'Tag no encontrado' }, { status: 404 });
    }

    // Eliminar el tag
    await prisma.tag.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Tag eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

