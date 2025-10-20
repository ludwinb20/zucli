import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/rooms/[id] - Obtener habitación por ID
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

    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      return NextResponse.json({ error: 'Habitación no encontrada' }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error('Error al obtener habitación:', error);
    return NextResponse.json(
      { error: 'Error al obtener habitación' },
      { status: 500 }
    );
  }
}

// PUT /api/rooms/[id] - Actualizar habitación
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role?.name !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { number, status } = body;

    // Verificar que la habitación existe
    const existingRoom = await prisma.room.findUnique({
      where: { id },
    });

    if (!existingRoom) {
      return NextResponse.json({ error: 'Habitación no encontrada' }, { status: 404 });
    }

    // Si se está cambiando el número, verificar que no exista otra con ese número
    if (number && number !== existingRoom.number) {
      const roomWithNumber = await prisma.room.findUnique({
        where: { number: number.trim() },
      });

      if (roomWithNumber) {
        return NextResponse.json(
          { error: 'Ya existe una habitación con ese número' },
          { status: 409 }
        );
      }
    }

    // No permitir cambiar manualmente de occupied a available
    // (solo se debe hacer al dar de alta)
    if (status === 'available' && existingRoom.status === 'occupied') {
      return NextResponse.json(
        { error: 'No se puede liberar una habitación ocupada manualmente. Debe darse de alta la hospitalización.' },
        { status: 400 }
      );
    }

    // Actualizar habitación
    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        ...(number && { number: number.trim() }),
        ...(status && { status }),
      },
    });

    return NextResponse.json(updatedRoom);
  } catch (error) {
    console.error('Error al actualizar habitación:', error);
    return NextResponse.json(
      { error: 'Error al actualizar habitación' },
      { status: 500 }
    );
  }
}

// DELETE /api/rooms/[id] - Eliminar habitación (solo si no está ocupada)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role?.name !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que la habitación existe
    const room = await prisma.room.findUnique({
      where: { id },
    });

    if (!room) {
      return NextResponse.json({ error: 'Habitación no encontrada' }, { status: 404 });
    }

    // No permitir eliminar habitación ocupada
    if (room.status === 'occupied') {
      return NextResponse.json(
        { error: 'No se puede eliminar una habitación ocupada' },
        { status: 400 }
      );
    }

    // Eliminar habitación
    await prisma.room.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Habitación eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar habitación:', error);
    return NextResponse.json(
      { error: 'Error al eliminar habitación' },
      { status: 500 }
    );
  }
}

