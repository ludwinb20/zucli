import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CashierStats, ChartDataPoint } from '@/types/dashboard';

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

    // Pagos del día (solo activos)
    const paymentsToday = await prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        isActive: true,
      },
      _sum: {
        total: true,
      },
    });

    // Pagos de la semana (solo activos)
    const paymentsThisWeek = await prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: startOfWeek,
        },
        isActive: true,
      },
      _sum: {
        total: true,
      },
    });

    // Pagos del mes (solo activos)
    const paymentsThisMonth = await prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
        isActive: true,
      },
      _sum: {
        total: true,
      },
    });

    // Calcular pagos por método de pago del día (basado en facturas emitidas hoy, solo pagos activos)
    const invoicesToday = await prisma.invoice.findMany({
      where: {
        fechaEmision: {
          gte: startOfDay,
          lte: endOfDay,
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

    const paymentsByMethod = {
      cash: 0,
      card: 0,
      transfer: 0,
    };

    invoicesToday.forEach((invoice) => {
      const payment = invoice.payment;
      if (!payment) return;

      // Usar pagos parciales si existen, sino usar el método único
      if (payment.partialPayments && payment.partialPayments.length > 0) {
        payment.partialPayments.forEach((pp) => {
          const method = pp.method.toLowerCase();
          if (method === 'efectivo' || method === 'cash') {
            paymentsByMethod.cash += pp.amount;
          } else if (method === 'tarjeta' || method === 'card') {
            paymentsByMethod.card += pp.amount;
          } else if (method === 'transferencia' || method === 'transfer') {
            paymentsByMethod.transfer += pp.amount;
          }
        });
      } else if (payment.paymentMethod) {
        // Fallback: usar método único si no hay pagos parciales
        const method = payment.paymentMethod.toLowerCase();
        if (method === 'efectivo' || method === 'cash') {
          paymentsByMethod.cash += payment.total;
        } else if (method === 'tarjeta' || method === 'card') {
          paymentsByMethod.card += payment.total;
        } else if (method === 'transferencia' || method === 'transfer') {
          paymentsByMethod.transfer += payment.total;
        }
      }
    });

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

    // Últimas transacciones (solo activas)
    const recentTransactions = await prisma.payment.findMany({
      where: {
        isActive: true,
      },
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

    // Datos de los últimos 7 días para el gráfico
    const last7DaysChart: ChartDataPoint[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const endOfDate = new Date(date);
      endOfDate.setHours(23, 59, 59, 999);

      // Consultar facturas emitidas en este día
      const invoicesForDay = await prisma.invoice.findMany({
        where: {
          fechaEmision: {
            gte: date,
            lte: endOfDate,
          },
          payment: {
            status: 'paid',
          },
        },
        include: {
          payment: {
            select: {
              total: true,
            },
          },
        },
      });

      const dayTotal = invoicesForDay.reduce((sum, invoice) => {
        return sum + (invoice.payment?.total || 0);
      }, 0);

      last7DaysChart.push({
        date: date.toLocaleDateString('es-HN', { day: '2-digit', month: 'short' }),
        value: dayTotal,
        label: date.toLocaleDateString('es-HN', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        }),
      });
    }

    const stats: CashierStats = {
      payments: {
        today: paymentsToday._sum.total || 0,
        thisWeek: paymentsThisWeek._sum.total || 0,
        thisMonth: paymentsThisMonth._sum.total || 0,
        byMethod: paymentsByMethod,
        last7Days: last7DaysChart,
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

