import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/rooms - Listar todas las habitaciones
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const rooms = await prisma.room.findMany({
      orderBy: {
        number: 'asc',
      },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Error al obtener habitaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener habitaciones' },
      { status: 500 }
    );
  }
}

// POST /api/rooms - Crear nueva habitación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role?.name !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { number, status = 'available' } = body;

    // Validar campos requeridos
    if (!number || !number.trim()) {
      return NextResponse.json(
        { error: 'El número de habitación es requerido' },
        { status: 400 }
      );
    }

    // Verificar que no exista una habitación con ese número
    const existingRoom = await prisma.room.findUnique({
      where: { number: number.trim() },
    });

    if (existingRoom) {
      return NextResponse.json(
        { error: 'Ya existe una habitación con ese número' },
        { status: 409 }
      );
    }

    // Crear habitación
    const room = await prisma.room.create({
      data: {
        number: number.trim(),
        status,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Error al crear habitación:', error);
    return NextResponse.json(
      { error: 'Error al crear habitación' },
      { status: 500 }
    );
  }
}

