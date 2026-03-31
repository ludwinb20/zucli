import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const MATCH_WINDOW_MS = 48 * 60 * 60 * 1000; // 48 horas

function canViewConsultation(
  roleName: string | undefined,
  userId: string,
  consultation: { doctorId: string | null }
): boolean {
  if (roleName === 'admin') return true;
  if (roleName === 'especialista' && consultation.doctorId === userId) return true;
  return false;
}

/**
 * GET /api/consultations/[id]/visit-context
 * Paciente completo + cita y preclínica (relación directa o heurística por fecha).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const roleName = session.user.role?.name;
    const userId = session.user.id;

    const consultation = await prisma.consultation.findUnique({
      where: { id },
      select: {
        id: true,
        patientId: true,
        doctorId: true,
        consultationDate: true,
        preclinicaId: true,
        preclinica: {
          include: {
            appointment: {
              include: {
                specialty: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!consultation) {
      return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });
    }

    if (!canViewConsultation(roleName, userId, consultation)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: consultation.patientId },
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    const hasDirect = !!(consultation.preclinicaId && consultation.preclinica);
    let appointment = consultation.preclinica?.appointment ?? null;
    let preclinica = consultation.preclinica;
    let match: 'linked' | 'inferred' | null = hasDirect ? 'linked' : null;

    if (!hasDirect) {
      const candidates = await prisma.appointment.findMany({
        where: {
          patientId: consultation.patientId,
          status: 'completado',
        },
        include: {
          preclinica: true,
          specialty: { select: { id: true, name: true } },
        },
        orderBy: { appointmentDate: 'desc' },
        take: 80,
      });

      const pool =
        candidates.filter((a) => a.preclinica != null).length > 0
          ? candidates.filter((a) => a.preclinica != null)
          : candidates;

      const t0 = consultation.consultationDate.getTime();
      let bestDiff = Infinity;
      let best: (typeof candidates)[0] | null = null;

      for (const a of pool) {
        const diff = Math.abs(a.appointmentDate.getTime() - t0);
        if (diff < bestDiff) {
          bestDiff = diff;
          best = a;
        }
      }

      if (best && bestDiff <= MATCH_WINDOW_MS) {
        appointment = best;
        preclinica = best.preclinica;
        match = 'inferred';
      }
    }

    return NextResponse.json({
      patient,
      appointment,
      preclinica,
      match,
    });
  } catch (error) {
    console.error('visit-context:', error);
    return NextResponse.json(
      { error: 'Error al obtener el contexto de visita' },
      { status: 500 }
    );
  }
}
