import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/sala-doctors - Listar todos los doctores de sala
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const doctors = await prisma.salaDoctor.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(doctors);
  } catch (error) {
    console.error('Error al obtener doctores de sala:', error);
    return NextResponse.json(
      { error: 'Error al obtener doctores de sala' },
      { status: 500 }
    );
  }
}

// POST /api/sala-doctors - Crear nuevo doctor de sala
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role?.name !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    // Validar campos requeridos
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre del doctor es requerido' },
        { status: 400 }
      );
    }

    // Crear doctor de sala
    const doctor = await prisma.salaDoctor.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(doctor, { status: 201 });
  } catch (error) {
    console.error('Error al crear doctor de sala:', error);
    return NextResponse.json(
      { error: 'Error al crear doctor de sala' },
      { status: 500 }
    );
  }
}

