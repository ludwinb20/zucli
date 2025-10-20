import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateMedicationControlData } from '@/types/hospitalization';

// GET /api/hospitalizations/[id]/medication-controls/[controlId] - Obtener control específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; controlId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: hospitalizationId, controlId } = await params;

    // Verificar que la hospitalización existe
    const hospitalization = await prisma.hospitalization.findUnique({
      where: { id: hospitalizationId },
      select: { id: true }
    });

    if (!hospitalization) {
      return NextResponse.json(
        { error: 'Hospitalización no encontrada' },
        { status: 404 }
      );
    }

    // Obtener el control específico
    const medicationControl = await prisma.medicationControl.findFirst({
      where: { 
        id: controlId,
        hospitalizationId 
      },
      include: {
        items: {
          include: {
            serviceItem: true,
            variant: true,
          },
        },
      },
    });

    if (!medicationControl) {
      return NextResponse.json(
        { error: 'Control de medicamentos no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(medicationControl);

  } catch (error) {
    console.error('Error al obtener control de medicamentos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/hospitalizations/[id]/medication-controls/[controlId] - Eliminar control
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; controlId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos
    if (!["admin", "recepcion", "especialista"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: hospitalizationId, controlId } = await params;

    // Verificar que la hospitalización existe
    const hospitalization = await prisma.hospitalization.findUnique({
      where: { id: hospitalizationId },
      select: { id: true, status: true }
    });

    if (!hospitalization) {
      return NextResponse.json(
        { error: 'Hospitalización no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el control existe
    const existingControl = await prisma.medicationControl.findFirst({
      where: { 
        id: controlId,
        hospitalizationId 
      },
    });

    if (!existingControl) {
      return NextResponse.json(
        { error: 'Control de medicamentos no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el control (los items se eliminan en cascada)
    await prisma.medicationControl.delete({
      where: { id: controlId },
    });

    return NextResponse.json({ message: 'Control de medicamentos eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar control de medicamentos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

