import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UpdatePaymentData } from '@/types/payments';

// GET /api/payments/[id] - Obtener un pago específico
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

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
          }
        },
        consultation: true,
        sale: true,
        hospitalization: true
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    return NextResponse.json(payment);

  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/payments/[id] - Actualizar un pago
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
    const body: UpdatePaymentData = await request.json();

    // Verificar que el pago existe
    const existingPayment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // Si se actualiza el estado
    if (body.status) {
      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          status: body.status,
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              identityNumber: true,
            }
          },
          consultation: true,
          sale: true,
          hospitalization: true
        }
      });

      return NextResponse.json(updatedPayment);
    }

    // TODO: La actualización de items debe hacerse a través de TransactionItem
    // directamente, no a través del Payment
    // if (body.items) { ... }

    return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 });

  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Error al actualizar el pago' }, { status: 500 });
  }
}

// DELETE /api/payments/[id] - Eliminar un pago
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

    // Verificar que el pago existe
    const payment = await prisma.payment.findUnique({
      where: { id }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // Eliminar el pago (los items se eliminarán en cascada)
    await prisma.payment.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Pago eliminado exitosamente' });

  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Error al eliminar el pago' }, { status: 500 });
  }
}

