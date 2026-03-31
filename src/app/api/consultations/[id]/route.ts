import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UpdateConsultationData } from '@/types/consultations';
import { mergePreclinicaIdIntoUpdate } from '@/lib/consultation-preclinica';

function canModifyConsultation(
  roleName: string | undefined,
  userId: string,
  consultation: { doctorId: string | null }
): boolean {
  if (roleName === 'admin') return true;
  if (roleName === 'especialista' && consultation.doctorId === userId) return true;
  return false;
}

function buildConsultationUpdateData(
  body: Partial<UpdateConsultationData>,
  options: { isAdmin: boolean; canSetStatus: boolean }
): Prisma.ConsultationUpdateInput {
  const { isAdmin, canSetStatus } = options;
  const data: Prisma.ConsultationUpdateInput = {};
  if (isAdmin && body.doctorId !== undefined) {
    data.doctorId = body.doctorId || null;
  }
  if (canSetStatus && body.status !== undefined && body.status) {
    data.status = body.status;
  }
  if (body.diagnosis !== undefined) {
    data.diagnosis = body.diagnosis || null;
  }
  if (body.currentIllness !== undefined) {
    data.currentIllness = body.currentIllness || null;
  }
  if (body.vitalSigns !== undefined) {
    data.vitalSigns = body.vitalSigns || null;
  }
  if (body.treatment !== undefined) {
    data.treatment = body.treatment || null;
  }
  if (body.observations !== undefined) {
    data.observations = body.observations || null;
  }
  return data;
}

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
    const { doctorId, preclinicaId, diagnosis, currentIllness, vitalSigns, treatment, observations, status } = body;

    // Verificar que la consulta existe
    const existingConsultation = await prisma.consultation.findUnique({
      where: { id }
    });

    if (!existingConsultation) {
      return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });
    }

    const roleName = session.user.role?.name;
    const userId = session.user.id;
    if (!canModifyConsultation(roleName, userId, existingConsultation)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const isAdmin = roleName === 'admin';
    const isOwnerSpecialist =
      roleName === 'especialista' && existingConsultation.doctorId === userId;
    const updatePayload = buildConsultationUpdateData(
      {
        doctorId,
        diagnosis,
        currentIllness,
        vitalSigns,
        treatment,
        observations,
        status,
      },
      { isAdmin, canSetStatus: isAdmin || isOwnerSpecialist }
    );

    const preMerge = await mergePreclinicaIdIntoUpdate(
      { preclinicaId },
      existingConsultation,
      isAdmin,
      isOwnerSpecialist,
      updatePayload
    );
    if (!preMerge.ok) {
      return NextResponse.json(
        { error: preMerge.error },
        { status: preMerge.status }
      );
    }

    const updatedConsultation = await prisma.consultation.update({
      where: { id },
      data: updatePayload,
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

    // Actualizar el pago si está pendiente
    try {
      // Obtener todos los items de la consulta
      const consultationItems = await prisma.transactionItem.findMany({
        where: {
          sourceType: 'consultation',
          sourceId: id
        }
      });

      // Calcular el total de los items
      const totalItems = consultationItems.reduce((sum, item) => sum + item.total, 0);

      // Buscar el pago pendiente asociado a esta consulta
      const pendingPayment = await prisma.payment.findFirst({
        where: {
          consultationId: id,
          status: 'pendiente'
        }
      });

      // Solo actualizar si el pago existe y está pendiente
      if (pendingPayment) {
        await prisma.payment.update({
          where: { id: pendingPayment.id },
          data: {
            total: totalItems
          }
        });
      }
    } catch (paymentError) {
      console.error('Error al actualizar el pago:', paymentError);
      // No fallar la consulta si hay error en el pago
    }

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

    const roleName = session.user.role?.name;
    const userId = session.user.id;
    if (!canModifyConsultation(roleName, userId, existingConsultation)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const isAdmin = roleName === 'admin';
    const isOwnerSpecialist =
      roleName === 'especialista' && existingConsultation.doctorId === userId;
    const updatePayload = buildConsultationUpdateData(body, {
      isAdmin,
      canSetStatus: isAdmin || isOwnerSpecialist,
    });

    const preMerge = await mergePreclinicaIdIntoUpdate(
      body,
      existingConsultation,
      isAdmin,
      isOwnerSpecialist,
      updatePayload
    );
    if (!preMerge.ok) {
      return NextResponse.json(
        { error: preMerge.error },
        { status: preMerge.status }
      );
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: 'No hay campos válidos para actualizar' },
        { status: 400 }
      );
    }

    const updatedConsultation = await prisma.consultation.update({
      where: { id },
      data: updatePayload,
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

    const roleName = session.user.role?.name;
    const userId = session.user.id;
    if (!canModifyConsultation(roleName, userId, existingConsultation)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
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
