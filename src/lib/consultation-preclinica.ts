import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** La preclínica pertenece al paciente (vía cita u hospitalización). */
export async function preclinicaBelongsToPatient(
  preclinicaId: string,
  patientId: string
): Promise<boolean> {
  const pc = await prisma.preclinica.findUnique({
    where: { id: preclinicaId },
    include: {
      appointment: { select: { patientId: true } },
      hospitalization: { select: { patientId: true } },
    },
  });
  if (!pc) return false;
  if (pc.appointment?.patientId === patientId) return true;
  if (pc.hospitalization?.patientId === patientId) return true;
  return false;
}

/** Incorpora preclinicaId al payload de actualización con validación. */
export async function mergePreclinicaIdIntoUpdate(
  body: { preclinicaId?: string | null },
  existing: { patientId: string },
  isAdmin: boolean,
  isOwner: boolean,
  updatePayload: Prisma.ConsultationUpdateInput
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (body.preclinicaId === undefined) {
    return { ok: true };
  }
  if (!isAdmin && !isOwner) {
    return { ok: true };
  }
  if (body.preclinicaId === null) {
    updatePayload.preclinicaId = null;
    return { ok: true };
  }
  if (typeof body.preclinicaId !== 'string' || !body.preclinicaId.trim()) {
    return { ok: false, status: 400, error: 'preclinicaId inválido' };
  }
  if (
    !(await preclinicaBelongsToPatient(body.preclinicaId, existing.patientId))
  ) {
    return {
      ok: false,
      status: 400,
      error: 'La preclínica no corresponde a este paciente',
    };
  }
  updatePayload.preclinicaId = body.preclinicaId;
  return { ok: true };
}
