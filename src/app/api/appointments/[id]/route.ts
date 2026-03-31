import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  AppointmentTurnSnapshot,
  renumberAffectedQueues,
} from '@/lib/appointment-turns';
import { UpdateAppointmentData } from '@/types/appointments';

const appointmentInclude = {
  patient: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      identityNumber: true,
      phone: true,
    },
  },
  specialty: {
    select: {
      id: true,
      name: true,
    },
  },
  doctor: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

function snapshotFromRow(row: {
  status: string;
  specialtyId: string;
  appointmentDate: Date;
}): AppointmentTurnSnapshot {
  return {
    status: row.status,
    specialtyId: row.specialtyId,
    appointmentDate: row.appointmentDate,
  };
}

async function mergeAndPersistAppointment(
  id: string,
  body: Partial<UpdateAppointmentData>
): Promise<
  | { ok: true; data: NonNullable<Awaited<ReturnType<typeof prisma.appointment.findUnique>>> }
  | { ok: false; response: NextResponse }
> {
  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 }),
    };
  }

  const { patientId, specialtyId, doctorId, appointmentDate, status, notes } = body;

  const finalPatientId =
    patientId !== undefined ? patientId : existing.patientId;
  const finalSpecialtyId =
    specialtyId !== undefined ? specialtyId : existing.specialtyId;
  const finalDoctorId =
    doctorId !== undefined ? doctorId || null : existing.doctorId;
  const finalAppointmentDate =
    appointmentDate !== undefined
      ? new Date(appointmentDate as string | Date)
      : existing.appointmentDate;
  const finalStatus = status !== undefined ? status : existing.status;
  const finalNotes =
    notes !== undefined
      ? typeof notes === 'string'
        ? notes.trim() || null
        : null
      : existing.notes;

  if (finalPatientId !== existing.patientId) {
    const patient = await prisma.patient.findUnique({
      where: { id: finalPatientId },
    });
    if (!patient) {
      return {
        ok: false,
        response: NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 }),
      };
    }
  }

  if (finalSpecialtyId !== existing.specialtyId) {
    const specialty = await prisma.specialty.findUnique({
      where: { id: finalSpecialtyId },
    });
    if (!specialty) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Especialidad no encontrada' },
          { status: 404 }
        ),
      };
    }
  }

  const conflictingAppointment = await prisma.appointment.findFirst({
    where: {
      patientId: finalPatientId,
      appointmentDate: finalAppointmentDate,
      status: { not: 'cancelado' },
      id: { not: id },
    },
  });

  if (conflictingAppointment) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'El paciente ya tiene una cita programada para esta fecha y hora' },
        { status: 409 }
      ),
    };
  }

  const before = snapshotFromRow(existing);

  await prisma.appointment.update({
    where: { id },
    data: {
      patientId: finalPatientId,
      specialtyId: finalSpecialtyId,
      doctorId: finalDoctorId,
      appointmentDate: finalAppointmentDate,
      status: finalStatus,
      notes: finalNotes,
      turnNumber: null,
    },
  });

  const afterRow = await prisma.appointment.findUniqueOrThrow({ where: { id } });
  await renumberAffectedQueues(before, snapshotFromRow(afterRow));

  const data = await prisma.appointment.findUnique({
    where: { id },
    include: appointmentInclude,
  });

  if (!data) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 }),
    };
  }

  return { ok: true, data };
}

// GET /api/appointments/[id] - Obtener cita por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
            phone: true,
            birthDate: true,
            gender: true,
          },
        },
        specialty: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Error al obtener la cita' },
      { status: 500 }
    );
  }
}

// PATCH /api/appointments/[id] - Actualizar cita (parcial)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Partial<UpdateAppointmentData> = await request.json();

    const result = await mergeAndPersistAppointment(id, body);
    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/appointments/[id] - Actualizar cita
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Partial<UpdateAppointmentData> = await request.json();

    const result = await mergeAndPersistAppointment(id, body);
    if (!result.ok) {
      return result.response;
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la cita' },
      { status: 500 }
    );
  }
}

// DELETE /api/appointments/[id] - Cancelar cita
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    if (existingAppointment.status === 'cancelado') {
      return NextResponse.json(
        { error: 'La cita ya está cancelada' },
        { status: 409 }
      );
    }

    if (existingAppointment.status === 'completado') {
      return NextResponse.json(
        { error: 'No se puede cancelar una cita ya completada' },
        { status: 409 }
      );
    }

    const before = snapshotFromRow(existingAppointment);

    await prisma.appointment.update({
      where: { id },
      data: {
        status: 'cancelado',
        turnNumber: null,
      },
    });

    await renumberAffectedQueues(before, {
      status: 'cancelado',
      specialtyId: existingAppointment.specialtyId,
      appointmentDate: existingAppointment.appointmentDate,
    });

    return NextResponse.json({ message: 'Cita cancelada exitosamente' });
  } catch (error) {
    console.error('Error canceling appointment:', error);
    return NextResponse.json(
      { error: 'Error al cancelar la cita' },
      { status: 500 }
    );
  }
}
