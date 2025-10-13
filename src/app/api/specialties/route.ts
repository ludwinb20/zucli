import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionUser, getUserRoleName } from '@/types/api';

// GET /api/specialties - Obtener todas las especialidades con sus días
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const specialties = await prisma.specialty.findMany({
      include: {
        specialtyDays: {
          orderBy: { dayOfWeek: 'asc' }
        },
        _count: {
          select: {
            appointments: true,
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ specialties });
  } catch (error) {
    console.error('Error fetching specialties:', error);
    return NextResponse.json({ error: 'Error al obtener especialidades' }, { status: 500 });
  }
}

// POST /api/specialties - Crear una nueva especialidad
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = getUserRoleName(session?.user as SessionUser);
    if (!session?.user || userRole !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { name, description, isActive } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const specialty = await prisma.specialty.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isActive: isActive !== false, // Default true
      },
      include: {
        specialtyDays: true
      }
    });

    return NextResponse.json({ specialty }, { status: 201 });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear especialidad';
      const errorWithCode = error as Error & { code?: string };
    console.error('Error creating specialty:', error);
    
    // Manejo de error de nombre duplicado
    if (errorWithCode.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una especialidad con ese nombre' }, { status: 400 });
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
