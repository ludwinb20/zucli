import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { RadiologistStats } from '@/types/dashboard';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role?.name !== 'radiologo') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Órdenes pendientes
    const pendingOrders = await prisma.radiologyOrder.count({
      where: {
        status: 'pending',
      },
    });

    // Órdenes completadas
    const completedOrders = await prisma.radiologyOrder.count({
      where: {
        status: 'completed',
      },
    });

    // Órdenes del día
    const ordersToday = await prisma.radiologyOrder.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Estudios más solicitados (top 5)
    const allOrders = await prisma.radiologyOrder.findMany({
      include: {
        payment: {
          include: {
            sale: true,
          },
        },
      },
    });

    // Obtener todos los items de las ventas asociadas
    const saleIds = allOrders
      .map(order => order.payment.sale?.id)
      .filter((id): id is string => id !== null && id !== undefined);

    const transactionItems = await prisma.transactionItem.findMany({
      where: {
        sourceType: 'sale',
        sourceId: {
          in: saleIds,
        },
      },
      select: {
        nombre: true,
        quantity: true,
      },
    });

    // Contar estudios
    const studyCounts: Record<string, number> = {};
    transactionItems.forEach(item => {
      studyCounts[item.nombre] = (studyCounts[item.nombre] || 0) + item.quantity;
    });

    const topStudies = Object.entries(studyCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Órdenes recientes
    const recentOrders = await prisma.radiologyOrder.findMany({
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
        payment: {
          include: {
            sale: true,
          },
        },
      },
    });

    // Obtener items de las órdenes recientes
    const recentSaleIds = recentOrders
      .map(order => order.payment.sale?.id)
      .filter((id): id is string => id !== null && id !== undefined);

    const recentTransactionItems = await prisma.transactionItem.findMany({
      where: {
        sourceType: 'sale',
        sourceId: {
          in: recentSaleIds,
        },
      },
      select: {
        sourceId: true,
        nombre: true,
        quantity: true,
      },
    });

    const stats: RadiologistStats = {
      orders: {
        pending: pendingOrders,
        completed: completedOrders,
        today: ordersToday,
      },
      topStudies,
      recentOrders: recentOrders.map(order => {
        const orderItems = recentTransactionItems
          .filter(item => item.sourceId === order.payment.sale?.id)
          .map(item => `${item.nombre}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`)
          .join(', ');

        return {
          id: order.id,
          patient: `${order.patient.firstName} ${order.patient.lastName}`,
          items: orderItems || 'Sin items',
          date: order.createdAt.toISOString(),
          status: order.status,
        };
      }),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas de radiólogo:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

