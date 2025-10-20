import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SpecialistStats } from '@/types/dashboard';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role?.name !== 'especialista') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el specialtyId del usuario
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        specialtyId: true 
      },
    });

    if (!user?.specialtyId) {
      return NextResponse.json(
        { error: 'Usuario sin especialidad asignada' },
        { status: 400 }
      );
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const next7Days = new Date(now);
    next7Days.setDate(now.getDate() + 7);
    next7Days.setHours(23, 59, 59);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Citas de hoy
    const appointmentsToday = await prisma.appointment.findMany({
      where: {
        specialtyId: user.specialtyId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        appointmentDate: 'asc',
      },
    });

    // Citas de los próximos 7 días (excluyendo hoy)
    const tomorrowStart = new Date(startOfDay);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const appointmentsWeek = await prisma.appointment.findMany({
      where: {
        specialtyId: user.specialtyId,
        appointmentDate: {
          gte: tomorrowStart,
          lte: next7Days,
        },
        status: {
          not: 'cancelled',
        },
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        appointmentDate: 'asc',
      },
    });

    // Consultas del mes actual (por doctorId)
    const consultationsThisMonth = await prisma.consultation.count({
      where: {
        doctorId: user.id,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Consultas completadas del mes
    const completedConsultations = await prisma.consultation.count({
      where: {
        doctorId: user.id,
        status: 'completed',
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    const stats: SpecialistStats = {
      appointmentsToday: appointmentsToday.map(a => ({
        id: a.id,
        patient: `${a.patient.firstName} ${a.patient.lastName}`,
        time: a.appointmentDate.toISOString(),
        status: a.status,
      })),
      appointmentsWeek: appointmentsWeek.map(a => ({
        date: a.appointmentDate.toISOString(),
        patient: `${a.patient.firstName} ${a.patient.lastName}`,
        time: a.appointmentDate.toISOString(),
        status: a.status,
      })),
      consultations: {
        thisMonth: consultationsThisMonth,
        completed: completedConsultations,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas de especialista:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

