import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/dashboard/cashier/range?startDate=...&endDate=...
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role?.name !== 'caja') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { error: 'Se requieren las fechas de inicio y fin' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Fechas inválidas' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'La fecha de inicio debe ser anterior a la fecha de fin' },
        { status: 400 }
      );
    }

    // Obtener facturas (invoices) en el rango de fechas
    // La fecha de emisión de la factura es cuando realmente se facturó
    const invoices = await prisma.invoice.findMany({
      where: {
        fechaEmision: {
          gte: startDate,
          lte: endDate,
        },
        payment: {
          status: 'paid',
          isActive: true, // Solo pagos activos
        },
      },
      include: {
        payment: {
          include: {
            partialPayments: true,
          },
        },
      },
    });

    // Agrupar por método de pago
    const totalsByMethod = {
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0,
    };

    invoices.forEach((invoice) => {
      const payment = invoice.payment;
      if (!payment) return;

      // Usar pagos parciales si existen, sino usar el método único
      if (payment.partialPayments && payment.partialPayments.length > 0) {
        payment.partialPayments.forEach((pp) => {
          const method = pp.method.toLowerCase();
          if (method === 'efectivo' || method === 'cash') {
            totalsByMethod.efectivo += pp.amount;
          } else if (method === 'tarjeta' || method === 'card') {
            totalsByMethod.tarjeta += pp.amount;
          } else if (method === 'transferencia' || method === 'transfer') {
            totalsByMethod.transferencia += pp.amount;
          }
        });
      } else if (payment.paymentMethod) {
        // Fallback: usar método único si no hay pagos parciales
        const method = payment.paymentMethod.toLowerCase();
        if (method === 'efectivo' || method === 'cash') {
          totalsByMethod.efectivo += payment.total;
        } else if (method === 'tarjeta' || method === 'card') {
          totalsByMethod.tarjeta += payment.total;
        } else if (method === 'transferencia' || method === 'transfer') {
          totalsByMethod.transferencia += payment.total;
        }
      }
    });

    return NextResponse.json({
      efectivo: totalsByMethod.efectivo,
      tarjeta: totalsByMethod.tarjeta,
      transferencia: totalsByMethod.transferencia,
      total: totalsByMethod.efectivo + totalsByMethod.tarjeta + totalsByMethod.transferencia,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas por rango:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

