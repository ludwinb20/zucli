import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateDaysOfStay, calculateHospitalizationCost, getDailyRate } from '@/lib/hospitalization-helpers';

// GET /api/hospitalizations/[id] - Obtener hospitalización específica
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

    const hospitalization = await prisma.hospitalization.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
            birthDate: true,
            gender: true,
          },
        },
        salaDoctor: {
          select: {
            id: true,
            name: true,
          },
        },
        room: true,
        dailyRateItem: {
          select: {
            id: true,
            name: true,
            basePrice: true,
          },
        },
        dailyRateVariant: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        preclinicas: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        insulinControls: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        intakeOutputControls: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        examenFisicos: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        medicationControls: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            items: {
              include: {
                serviceItem: true,
                variant: true,
              },
            },
          },
        },
        nursingNotes: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        admissionRecord: {
          include: {
            anotaciones: {
              orderBy: { createdAt: 'asc' }
            },
            ordenes: {
              orderBy: { createdAt: 'asc' }
            },
          }
        },
        dischargeRecord: {
          include: {
            cita: {
              select: {
                id: true,
                appointmentDate: true,
                status: true,
                specialty: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        },
        payments: true,
      },
    });

    if (!hospitalization) {
      return NextResponse.json(
        { error: 'Hospitalización no encontrada' },
        { status: 404 }
      );
    }

    // Calcular costo si hay dailyRateItem
    let costCalculation = null;
    if (hospitalization.dailyRateItem) {
      costCalculation = calculateHospitalizationCost(
        hospitalization.admissionDate,
        hospitalization.dailyRateItem.basePrice,
        hospitalization.dischargeDate
      );
    }

    return NextResponse.json({
      ...hospitalization,
      costCalculation,
    });
  } catch (error) {
    console.error('Error al obtener hospitalización:', error);
    return NextResponse.json(
      { error: 'Error al obtener hospitalización' },
      { status: 500 }
    );
  }
}

// PATCH /api/hospitalizations/[id] - Actualizar hospitalización
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
    const body = await request.json();
    const { roomId, dailyRateItemId, diagnosis, notes, status, dischargeDate, dischargeNotes } = body;

    // Verificar que la hospitalización existe
    const existingHosp = await prisma.hospitalization.findUnique({
      where: { id },
      include: {
        room: true,
        dailyRateItem: true,
        dailyRateVariant: true,
      },
    });

    if (!existingHosp) {
      return NextResponse.json(
        { error: 'Hospitalización no encontrada' },
        { status: 404 }
      );
    }

    // Si se está dando de alta
    if (status === 'alta') {
      // Validar que tenga dailyRateItem configurado
      if (!existingHosp.dailyRateItemId) {
        return NextResponse.json(
          { error: 'No se puede dar de alta sin item de cobro diario configurado' },
          { status: 400 }
        );
      }

      const finalDischargeDate = dischargeDate ? new Date(dischargeDate) : new Date();

      // Obtener la tarifa diaria correcta (variante o base)
      const dailyRate = getDailyRate(existingHosp.dailyRateItem, existingHosp.dailyRateVariant);

      // Calcular costo total
      const daysOfStay = calculateDaysOfStay(existingHosp.admissionDate, finalDischargeDate);
      const totalCost = daysOfStay * dailyRate;

      // Actualizar hospitalización
      const updatedHosp = await prisma.hospitalization.update({
        where: { id },
        data: {
          status: 'completada',
          dischargeDate: finalDischargeDate,
          notes: dischargeNotes ? `${existingHosp.notes || ''}\n\nNotas de alta: ${dischargeNotes}`.trim() : existingHosp.notes,
        },
        include: {
          patient: true,
          salaDoctor: true,
          room: true,
          dailyRateItem: true,
          preclinicas: true,
        },
      });

      // Actualizar el pago con el monto total
      await prisma.payment.updateMany({
        where: {
          hospitalizationId: id,
        },
        data: {
          total: totalCost,
          status: 'pendiente', // Queda pendiente para que caja lo procese
        },
      });

      // Liberar habitación si tenía una asignada
      if (existingHosp.roomId) {
        await prisma.room.update({
          where: { id: existingHosp.roomId },
          data: { status: 'available' },
        });
      }

      return NextResponse.json(updatedHosp);
    }

    // Actualización normal (no es alta)
    const updateData: {
      roomId?: string | null;
      dailyRateItemId?: string | null;
      diagnosis?: string | null;
      notes?: string | null;
    } = {};

    if (roomId !== undefined) updateData.roomId = roomId;
    if (dailyRateItemId !== undefined) updateData.dailyRateItemId = dailyRateItemId;
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (notes !== undefined) updateData.notes = notes;

    // Si se cambia la habitación, actualizar status de ambas
    if (roomId && roomId !== existingHosp.roomId) {
      // Verificar que la nueva habitación esté disponible
      const newRoom = await prisma.room.findUnique({
        where: { id: roomId },
      });

      if (!newRoom) {
        return NextResponse.json(
          { error: 'Habitación no encontrada' },
          { status: 404 }
        );
      }

      if (newRoom.status === 'occupied') {
        return NextResponse.json(
          { error: 'La habitación ya está ocupada' },
          { status: 400 }
        );
      }

      // Liberar habitación anterior si la tenía
      if (existingHosp.roomId) {
        await prisma.room.update({
          where: { id: existingHosp.roomId },
          data: { status: 'available' },
        });
      }

      // Ocupar nueva habitación
      await prisma.room.update({
        where: { id: roomId },
        data: { status: 'occupied' },
      });
    }

    const updatedHospitalization = await prisma.hospitalization.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
            birthDate: true,
            gender: true,
          },
        },
        salaDoctor: {
          select: {
            id: true,
            name: true,
          },
        },
        room: true,
        dailyRateItem: {
          select: {
            id: true,
            name: true,
            basePrice: true,
          },
        },
        dailyRateVariant: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        preclinicas: true,
      },
    });

    return NextResponse.json(updatedHospitalization);
  } catch (error) {
    console.error('Error al actualizar hospitalización:', error);
    return NextResponse.json(
      { error: 'Error al actualizar hospitalización' },
      { status: 500 }
    );
  }
}

// DELETE /api/hospitalizations/[id] - Cancelar hospitalización
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

    // Verificar que la hospitalización existe
    const hospitalization = await prisma.hospitalization.findUnique({
      where: { id },
      include: {
        preclinicas: true,
        payments: true,
      },
    });

    if (!hospitalization) {
      return NextResponse.json(
        { error: 'Hospitalización no encontrada' },
        { status: 404 }
      );
    }

    // No permitir eliminar si tiene preclínicas o pagos procesados
    if (hospitalization.preclinicas.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una hospitalización con preclínicas registradas' },
        { status: 400 }
      );
    }

    const hasProcessedPayments = hospitalization.payments.some(p => p.status === 'paid');
    if (hasProcessedPayments) {
      return NextResponse.json(
        { error: 'No se puede eliminar una hospitalización con pagos procesados' },
        { status: 400 }
      );
    }

    // Liberar habitación si la tenía
    if (hospitalization.roomId) {
      await prisma.room.update({
        where: { id: hospitalization.roomId },
        data: { status: 'available' },
      });
    }

    // Eliminar pagos asociados (deben estar pendientes)
    await prisma.payment.deleteMany({
      where: { hospitalizationId: id },
    });

    // Eliminar hospitalización
    await prisma.hospitalization.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Hospitalización eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar hospitalización:', error);
    return NextResponse.json(
      { error: 'Error al eliminar hospitalización' },
      { status: 500 }
    );
  }
}

