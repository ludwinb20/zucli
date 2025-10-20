import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CashierStats } from '@/types/dashboard';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role?.name !== 'caja') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Pagos del día
    const paymentsToday = await prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Pagos de la semana
    const paymentsThisWeek = await prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: startOfWeek,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Pagos del mes
    const paymentsThisMonth = await prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Placeholder para métodos de pago (dividir en partes iguales)
    const totalToday = paymentsToday._sum.total || 0;
    const paymentsByMethod = {
      cash: totalToday / 3,
      card: totalToday / 3,
      transfer: totalToday / 3,
    };

    // Facturas generadas (legales y simples)
    const legalInvoices = await prisma.invoice.count({
      where: {
        type: 'legal',
      },
    });

    const simpleInvoices = await prisma.invoice.count({
      where: {
        type: 'simple',
      },
    });

    // Últimas transacciones
    const recentTransactions = await prisma.payment.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const stats: CashierStats = {
      payments: {
        today: paymentsToday._sum.total || 0,
        thisWeek: paymentsThisWeek._sum.total || 0,
        thisMonth: paymentsThisMonth._sum.total || 0,
        byMethod: paymentsByMethod,
      },
      invoices: {
        legal: legalInvoices,
        simple: simpleInvoices,
      },
      recentTransactions: recentTransactions.map(t => ({
        id: t.id,
        patient: `${t.patient?.firstName || ''} ${t.patient?.lastName || ''}`.trim() || 'Anónimo',
        amount: t.total,
        date: t.createdAt.toISOString(),
        status: t.status,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas de caja:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

