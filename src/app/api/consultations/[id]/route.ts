import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UpdateConsultationData } from '@/types/consultations';

// GET /api/consultations/[id] - Obtener consulta específica
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
    const consultation = await prisma.consultation.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
          }
        }
      }
    });

    if (!consultation) {
      return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });
    }

    return NextResponse.json(consultation);

  } catch (error) {
    console.error('Error fetching consultation:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/consultations/[id] - Actualizar consulta completa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateConsultationData = await request.json();
    const { doctorId, diagnosis, currentIllness, vitalSigns, treatment, observations, status } = body;

    // Verificar que la consulta existe
    const existingConsultation = await prisma.consultation.findUnique({
      where: { id }
    });

    if (!existingConsultation) {
      return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });
    }

    const updatedConsultation = await prisma.consultation.update({
      where: { id },
      data: {
        ...(doctorId && { doctorId }),
        ...(diagnosis !== undefined && { diagnosis: diagnosis || null }),
        ...(currentIllness !== undefined && { currentIllness: currentIllness || null }),
        ...(vitalSigns !== undefined && { vitalSigns: vitalSigns || null }),
        ...(treatment !== undefined && { treatment: treatment || null }),
        ...(observations !== undefined && { observations: observations || null }),
        ...(status && { status }),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
          }
        }
      }
    });

    return NextResponse.json(updatedConsultation);

  } catch (error) {
    console.error('Error updating consultation:', error);
    return NextResponse.json({ error: 'Error al actualizar la consulta' }, { status: 500 });
  }
}

// PATCH /api/consultations/[id] - Actualizar consulta parcial
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body: Partial<UpdateConsultationData> = await request.json();

    // Verificar que la consulta existe
    const existingConsultation = await prisma.consultation.findUnique({
      where: { id }
    });

    if (!existingConsultation) {
      return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });
    }

    const updatedConsultation = await prisma.consultation.update({
      where: { id },
      data: body,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
          }
        }
      }
    });

    return NextResponse.json(updatedConsultation);

  } catch (error) {
    console.error('Error updating consultation:', error);
    return NextResponse.json({ error: 'Error al actualizar la consulta' }, { status: 500 });
  }
}

// DELETE /api/consultations/[id] - Eliminar consulta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que la consulta existe
    const existingConsultation = await prisma.consultation.findUnique({
      where: { id }
    });

    if (!existingConsultation) {
      return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });
    }

    await prisma.consultation.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Consulta eliminada exitosamente' });

  } catch (error) {
    console.error('Error deleting consultation:', error);
    return NextResponse.json({ error: 'Error al eliminar la consulta' }, { status: 500 });
  }
}
