import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/sala-doctors/[id] - Obtener doctor de sala por ID
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

    const doctor = await prisma.salaDoctor.findUnique({
      where: { id },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor no encontrado' }, { status: 404 });
    }

    return NextResponse.json(doctor);
  } catch (error) {
    console.error('Error al obtener doctor de sala:', error);
    return NextResponse.json(
      { error: 'Error al obtener doctor de sala' },
      { status: 500 }
    );
  }
}

// PUT /api/sala-doctors/[id] - Actualizar doctor de sala
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
    const { name } = body;

    // Validar campos requeridos
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre del doctor es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el doctor existe
    const existingDoctor = await prisma.salaDoctor.findUnique({
      where: { id },
    });

    if (!existingDoctor) {
      return NextResponse.json({ error: 'Doctor no encontrado' }, { status: 404 });
    }

    // Actualizar doctor de sala
    const updatedDoctor = await prisma.salaDoctor.update({
      where: { id },
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(updatedDoctor);
  } catch (error) {
    console.error('Error al actualizar doctor de sala:', error);
    return NextResponse.json(
      { error: 'Error al actualizar doctor de sala' },
      { status: 500 }
    );
  }
}

// DELETE /api/sala-doctors/[id] - Eliminar doctor de sala
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

    // Verificar que el doctor existe
    const doctor = await prisma.salaDoctor.findUnique({
      where: { id },
      include: {
        hospitalizations: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor no encontrado' }, { status: 404 });
    }

    // No permitir eliminar si tiene hospitalizaciones asociadas
    if (doctor.hospitalizations.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un doctor con hospitalizaciones asociadas' },
        { status: 400 }
      );
    }

    // Eliminar doctor de sala
    await prisma.salaDoctor.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Doctor eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar doctor de sala:', error);
    return NextResponse.json(
      { error: 'Error al eliminar doctor de sala' },
      { status: 500 }
    );
  }
}

