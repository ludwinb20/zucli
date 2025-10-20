import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ReceptionStats } from '@/types/dashboard';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role?.name !== 'recepcion') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
    endOfWeek.setHours(23, 59, 59);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Citas del día
    const appointmentsToday = await prisma.appointment.findMany({
      where: {
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
        specialty: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        appointmentDate: 'asc',
      },
    });

    // Total de pacientes
    const totalPatients = await prisma.patient.count();

    // Pacientes nuevos del mes
    const newPatientsThisMonth = await prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Próximas citas de la semana (excluyendo hoy)
    const tomorrowStart = new Date(startOfDay);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const upcomingAppointments = await prisma.appointment.findMany({
      where: {
        appointmentDate: {
          gte: tomorrowStart,
          lte: endOfWeek,
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
        specialty: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        appointmentDate: 'asc',
      },
      take: 20,
    });

    // Hospitalizaciones activas
    const activeHospitalizations = await prisma.hospitalization.findMany({
      where: {
        status: 'iniciada',
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
          },
        },
        room: {
          select: {
            number: true,
          },
        },
        salaDoctor: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        admissionDate: 'desc',
      },
      take: 15,
    });

    const stats: ReceptionStats = {
      appointmentsToday: appointmentsToday.map(a => ({
        id: a.id,
        patient: `${a.patient.firstName} ${a.patient.lastName}`,
        specialty: a.specialty.name,
        time: a.appointmentDate.toISOString(),
        status: a.status,
      })),
      patients: {
        total: totalPatients,
        newThisMonth: newPatientsThisMonth,
      },
      upcomingAppointments: upcomingAppointments.map(a => ({
        date: a.appointmentDate.toISOString(),
        patient: `${a.patient.firstName} ${a.patient.lastName}`,
        specialty: a.specialty.name,
        time: a.appointmentDate.toISOString(),
      })),
      activeHospitalizations: activeHospitalizations.map(h => ({
        id: h.id,
        patientId: h.patient.id,
        patient: `${h.patient.firstName} ${h.patient.lastName}`,
        identityNumber: h.patient.identityNumber,
        room: h.room?.number || 'Sin asignar',
        doctor: h.salaDoctor.name,
        admissionDate: h.admissionDate.toISOString(),
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error al obtener estadísticas de recepción:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}

