import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const allowedRoles = ['admin', 'recepcion', 'medico_sala'];

function hasPermission(session: Awaited<ReturnType<typeof getServerSession<typeof authOptions>> | null>) {
  const roleName = session?.user?.role?.name;
  return roleName ? allowedRoles.includes(roleName) : false;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const rawName = typeof body.name === 'string' ? body.name.trim() : '';

    if (!rawName) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const existingByName = await prisma.medicationName.findFirst({
      where: {
        id: { not: id },
        name: {
          equals: rawName,
        },
      },
    });

    if (existingByName) {
      return NextResponse.json({ error: 'Ya existe un medicamento con ese nombre' }, { status: 409 });
    }

    const updated = await prisma.medicationName.update({
      where: { id },
      data: {
        name: rawName,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating medication name:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el nombre de medicamento' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.medicationName.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting medication name:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el nombre de medicamento' },
      { status: 500 }
    );
  }
}
