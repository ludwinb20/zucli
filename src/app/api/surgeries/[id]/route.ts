import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UpdateSurgeryData } from '@/types/surgery';

// GET /api/surgeries/[id] - Obtener cirugía específica
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

    const surgery = await prisma.surgery.findUnique({
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
        surgeryItem: {
          select: {
            id: true,
            name: true,
            basePrice: true,
          },
        },
        payment: {
          select: {
            id: true,
            total: true,
            status: true,
          },
        },
        operativeNote: true,
        medicalOrders: {
          include: {
            anotaciones: {
              orderBy: { createdAt: 'asc' }
            },
            ordenes: {
              orderBy: { createdAt: 'asc' }
            },
          }
        },
        anesthesiaRecord: true,
        materialControls: {
          orderBy: { createdAt: 'asc' }
        },
        operatingRoomRequest: true,
        safetyChecklist: {
          include: {
            entrada: true,
            pausa: true,
            salida: true,
          }
        },
        usedMaterials: true,
        hospitalizations: {
          select: {
            id: true,
            admissionDate: true,
            dischargeDate: true,
            status: true,
            room: {
              select: {
                id: true,
                number: true
              }
            }
          }
        }
      },
    });

    if (!surgery) {
      return NextResponse.json(
        { error: 'Cirugía no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(surgery);

  } catch (error) {
    console.error('Error al obtener cirugía:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PATCH /api/surgeries/[id] - Actualizar estado de cirugía
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos
    if (!["admin", "recepcion", "especialista", "medico_sala"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id } = await params;
    const body: UpdateSurgeryData = await request.json();

    // Verificar que la cirugía existe
    const surgery = await prisma.surgery.findUnique({
      where: { id }
    });

    if (!surgery) {
      return NextResponse.json(
        { error: 'Cirugía no encontrada' },
        { status: 404 }
      );
    }

    // Construir datos a actualizar
    const updateData: {
      status?: string;
      completedDate?: Date | null;
    } = {};

    if (body.status) {
      updateData.status = body.status;
      
      // Si se marca como finalizada, agregar fecha
      if (body.status === 'finalizada' && !surgery.completedDate) {
        updateData.completedDate = new Date();
      }
    }

    // Actualizar cirugía
    const updatedSurgery = await prisma.surgery.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true
          }
        },
        surgeryItem: {
          select: {
            id: true,
            name: true,
            basePrice: true
          }
        },
        payment: {
          select: {
            id: true,
            total: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json(updatedSurgery);

  } catch (error) {
    console.error('Error al actualizar cirugía:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/surgeries/[id] - Eliminar cirugía
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos (solo admin)
    if (session.user.role?.name !== 'admin') {
      return NextResponse.json({ error: 'Solo administradores pueden eliminar cirugías' }, { status: 403 });
    }

    const { id } = await params;

    // Verificar que la cirugía existe
    const surgery = await prisma.surgery.findUnique({
      where: { id },
      include: {
        hospitalizations: { select: { id: true } },
        payment: { select: { id: true } }
      }
    });

    if (!surgery) {
      return NextResponse.json(
        { error: 'Cirugía no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si tiene hospitalizaciones relacionadas
    if (surgery.hospitalizations && surgery.hospitalizations.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una cirugía con hospitalizaciones relacionadas' },
        { status: 400 }
      );
    }

    // Eliminar el pago asociado si existe
    if (surgery.payment) {
      await prisma.payment.delete({
        where: { id: surgery.payment.id }
      });
    }

    // Eliminar transaction items
    await prisma.transactionItem.deleteMany({
      where: {
        sourceType: 'surgery',
        sourceId: id
      }
    });

    // Eliminar la cirugía (cascade eliminará todos los formularios)
    await prisma.surgery.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Cirugía eliminada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar cirugía:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

