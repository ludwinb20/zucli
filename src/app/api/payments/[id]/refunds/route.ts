import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateRefundData } from '@/types/payments';

// POST /api/payments/[id]/refunds - Crear un reembolso
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!["admin", "cajero"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: paymentId } = await params;
    const body: CreateRefundData = await request.json();

    // Validaciones
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'El monto del reembolso debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (!body.reason || body.reason.trim() === '') {
      return NextResponse.json(
        { error: 'El motivo del reembolso es requerido' },
        { status: 400 }
      );
    }

    // Verificar que el pago existe
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        refunds: true
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el pago esté en estado "paid"
    if (payment.status !== 'paid') {
      return NextResponse.json(
        { error: 'Solo se pueden reembolsar pagos que ya han sido pagados' },
        { status: 400 }
      );
    }

    // Calcular total de reembolsos existentes
    const totalRefunded = payment.refunds.reduce((sum, refund) => sum + refund.amount, 0);
    
    // Validar que el nuevo reembolso no exceda el total del pago
    if (totalRefunded + body.amount > payment.total) {
      return NextResponse.json(
        { error: `El monto del reembolso excede el saldo disponible. Total del pago: ${payment.total}, Ya reembolsado: ${totalRefunded}, Disponible: ${payment.total - totalRefunded}` },
        { status: 400 }
      );
    }

    // Crear el reembolso
    const refund = await prisma.refund.create({
      data: {
        paymentId,
        amount: body.amount,
        reason: body.reason,
        createdBy: session.user.id
      }
    });

    return NextResponse.json(refund, { status: 201 });

  } catch (error) {
    console.error('Error al crear reembolso:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/payments/[id]/refunds - Listar reembolsos de un pago
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: paymentId } = await params;

    const refunds = await prisma.refund.findMany({
      where: { paymentId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ refunds });

  } catch (error) {
    console.error('Error al obtener reembolsos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

