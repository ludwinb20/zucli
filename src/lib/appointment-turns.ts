import { prisma } from '@/lib/prisma';

export function getDayBounds(appointmentDate: Date): { dayStart: Date; dayEnd: Date } {
  const dayStart = new Date(appointmentDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);
  return { dayStart, dayEnd };
}

export type AppointmentTurnSnapshot = {
  status: string;
  specialtyId: string;
  appointmentDate: Date;
};

function queueDedupeKey(specialtyId: string, d: Date): string {
  const { dayStart } = getDayBounds(d);
  return `${specialtyId}|${dayStart.getTime()}`;
}

/** Colas (especialidad + día) que deben reenumerarse tras pasar de `before` a `after`. */
export function collectQueuesToRenumber(
  before: AppointmentTurnSnapshot,
  after: AppointmentTurnSnapshot
): Array<{ specialtyId: string; anchorDate: Date }> {
  const candidates: Array<{ specialtyId: string; anchorDate: Date }> = [];
  if (before.status === 'pendiente') {
    candidates.push({
      specialtyId: before.specialtyId,
      anchorDate: before.appointmentDate,
    });
  }
  if (after.status === 'pendiente') {
    candidates.push({
      specialtyId: after.specialtyId,
      anchorDate: after.appointmentDate,
    });
  }
  const seen = new Set<string>();
  const out: typeof candidates = [];
  for (const c of candidates) {
    const k = queueDedupeKey(c.specialtyId, c.anchorDate);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
  }
  return out;
}

/**
 * Asigna turnNumber 1..n a todas las citas pendientes del día para la especialidad,
 * orden por appointmentDate asc, id asc.
 */
export async function renumberPendienteQueue(
  specialtyId: string,
  anchorDate: Date
): Promise<void> {
  const { dayStart, dayEnd } = getDayBounds(anchorDate);
  const rows = await prisma.appointment.findMany({
    where: {
      specialtyId,
      status: 'pendiente',
      appointmentDate: { gte: dayStart, lte: dayEnd },
    },
    orderBy: [{ appointmentDate: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });

  if (rows.length === 0) return;

  await prisma.$transaction(
    rows.map((row, index) =>
      prisma.appointment.update({
        where: { id: row.id },
        data: { turnNumber: index + 1 },
      })
    )
  );
}

export async function renumberAffectedQueues(
  before: AppointmentTurnSnapshot,
  after: AppointmentTurnSnapshot
): Promise<void> {
  for (const { specialtyId, anchorDate } of collectQueuesToRenumber(
    before,
    after
  )) {
    await renumberPendienteQueue(specialtyId, anchorDate);
  }
}
