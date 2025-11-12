import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminStats } from '@/types/dashboard';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role?.name !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total de pacientes
    const totalPatients = await prisma.patient.count();
    const newPatientsThisMonth = await prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Citas del día
    const appointmentsToday = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _count: true,
    });

    const appointmentsByStatus = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };

    appointmentsToday.forEach((item) => {
      const status = item.status as keyof typeof appointmentsByStatus;
      if (status in appointmentsByStatus) {
        appointmentsByStatus[status] = item._count;
      }
    });

    const appointmentsThisWeek = await prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: startOfWeek,
        },
      },
    });

    // Citas de los últimos 7 días (para el gráfico)
    const last7DaysData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      
      const count = await prisma.appointment.count({
        where: {
          appointmentDate: {
            gte: startOfDate,
            lte: endOfDate,
          },
        },
      });
      
      last7DaysData.push({
        date: date.toLocaleDateString('es-HN', { day: '2-digit', month: 'short' }),
        value: count,
        label: date.toLocaleDateString('es-HN'),
      });
    }

    // Ingresos (pagos con status 'paid' y activos)
    const paymentsToday = await prisma.payment.aggregate({
      where: {
        status: 'paid',
        isActive: true, // Solo pagos activos
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _sum: {
        total: true,
      },
    });

    const paymentsThisMonth = await prisma.payment.aggregate({
      where: {
        status: 'paid',
        isActive: true, // Solo pagos activos
        createdAt: {
          gte: startOfMonth,
        },
      },
      _sum: {
        total: true,
      },
    });

    // Órdenes pendientes
    const pendingRadiologyOrders = await prisma.radiologyOrder.count({
      where: {
        status: 'pending',
      },
    });

    const pendingConsultations = await prisma.consultation.count({
      where: {
        status: 'pending',
      },
    });

    // Usuarios activos por rol
    const activeUsersByRole = await prisma.user.groupBy({
      by: ['roleId'],
      where: {
        isActive: true,
      },
      _count: true,
    });

    const roles = await prisma.role.findMany();
    const roleMap = Object.fromEntries(roles.map(r => [r.id, r.name]));

    const activeUsers: Record<string, number> = {};
    activeUsersByRole.forEach((item) => {
      const roleName = roleMap[item.roleId] || 'unknown';
      activeUsers[roleName] = item._count;
    });

    // Actividad reciente (últimas acciones del sistema, solo activas)
    const recentPayments = await prisma.payment.findMany({
      where: {
        isActive: true, // Solo pagos activos
      },
      take: 5,
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

    const recentAppointments = await prisma.appointment.findMany({
      take: 5,
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

    const recentActivity = [
      ...recentPayments.map(p => ({
        action: `Pago registrado - L${p.total.toFixed(2)}`,
        user: `${p.patient?.firstName} ${p.patient?.lastName}`,
        time: p.createdAt.toISOString(),
        module: 'Pagos',
      })),
      ...recentAppointments.map(a => ({
        action: `Cita ${a.status}`,
        user: `${a.patient?.firstName} ${a.patient?.lastName}`,
        time: a.createdAt.toISOString(),
        module: 'Citas',
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);

    const stats: AdminStats = {
      patients: {
        total: totalPatients,
        newThisMonth: newPatientsThisMonth,
      },
      appointments: {
        today: appointmentsByStatus,
        thisWeek: appointmentsThisWeek,
        last7Days: last7DaysData,
      },
      revenue: {
        today: paymentsToday._sum.total || 0,
        thisMonth: paymentsThisMonth._sum.total || 0,
      },
      pendingOrders: {
        radiology: pendingRadiologyOrders,
        consultations: pendingConsultations,
      },
      activeUsers: {
        byRole: activeUsers,
      },
      recentActivity,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas del admin:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

