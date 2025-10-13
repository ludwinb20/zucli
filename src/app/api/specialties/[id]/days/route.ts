import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionUser, getUserRoleName } from '@/types/api';

// GET /api/specialties/:id/days - Obtener días de una especialidad
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

    const days = await prisma.specialtyDay.findMany({
      where: { specialtyId: id },
      orderBy: { dayOfWeek: 'asc' }
    });

    return NextResponse.json({ days });
  } catch (error) {
    console.error('Error fetching specialty days:', error);
    return NextResponse.json({ error: 'Error al obtener los días' }, { status: 500 });
  }
}

// POST /api/specialties/:id/days - Actualizar días de una especialidad
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || getUserRoleName(session.user as SessionUser) !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const { days } = await request.json(); // Array de números [0-6]

    // Validar que days sea un array de números entre 0-6
    if (!Array.isArray(days) || !days.every(day => typeof day === 'number' && day >= 0 && day <= 6)) {
      return NextResponse.json({ error: 'Formato de días inválido' }, { status: 400 });
    }

    // Eliminar días existentes y crear los nuevos en una transacción
    await prisma.$transaction([
      // Eliminar días existentes
      prisma.specialtyDay.deleteMany({
        where: { specialtyId: id }
      }),
      // Crear nuevos días
      ...days.map(dayOfWeek => 
        prisma.specialtyDay.create({
          data: {
            specialtyId: id,
            dayOfWeek
          }
        })
      )
    ]);

    // Obtener días actualizados
    const updatedDays = await prisma.specialtyDay.findMany({
      where: { specialtyId: id },
      orderBy: { dayOfWeek: 'asc' }
    });

    return NextResponse.json({ days: updatedDays });
  } catch (error) {
    console.error('Error updating specialty days:', error);
    return NextResponse.json({ error: 'Error al actualizar los días' }, { status: 500 });
  }
}

