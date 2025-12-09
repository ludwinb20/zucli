import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionUser, getUserRoleName } from '@/types/api';

// GET /api/specialties/:id - Obtener una especialidad específica
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

    const specialty = await prisma.specialty.findUnique({
      where: { id },
      include: {
        specialtyDays: {
          orderBy: { dayOfWeek: 'asc' }
        },
        users: {
          where: {
            isActive: true,
            role: {
              name: 'especialista'
            }
          },
          select: {
            id: true,
            name: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      }
    });

    if (!specialty) {
      return NextResponse.json({ error: 'Especialidad no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ specialty });
  } catch (error) {
    console.error('Error fetching specialty:', error);
    return NextResponse.json({ error: 'Error al obtener la especialidad' }, { status: 500 });
  }
}

// PUT /api/specialties/:id - Actualizar una especialidad
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || getUserRoleName(session.user as SessionUser) !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const { name, description, isActive } = await request.json();

    const specialty = await prisma.specialty.update({
      where: { id },
      data: {
        name,
        description,
        isActive,
      },
      include: {
        specialtyDays: true
      }
    });

    return NextResponse.json({ specialty });
  } catch (error) {
    console.error('Error updating specialty:', error);
    return NextResponse.json({ error: 'Error al actualizar la especialidad' }, { status: 500 });
  }
}

// DELETE /api/specialties/:id - Eliminar una especialidad
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || getUserRoleName(session.user as SessionUser) !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.specialty.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting specialty:', error);
    return NextResponse.json({ error: 'Error al eliminar la especialidad' }, { status: 500 });
  }
}
