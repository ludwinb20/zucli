import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UpdateAppointmentData } from '@/types/appointments';

// Función para asignar número de turno
async function assignTurnNumber(specialtyId: string, appointmentDate: Date): Promise<number> {
  // Obtener el inicio del día en la zona horaria local
  const dateStart = new Date(appointmentDate);
  dateStart.setHours(0, 0, 0, 0);
  
  const dateEnd = new Date(dateStart);
  dateEnd.setHours(23, 59, 59, 999);

  // Contar cuántas citas pendientes hay para esta especialidad en este día
  const count = await prisma.appointment.count({
    where: {
      specialtyId,
      status: 'pendiente',
      appointmentDate: {
        gte: dateStart,
        lte: dateEnd
      },
      turnNumber: {
        not: null
      }
    }
  });

  // El siguiente número de turno es el count + 1
  return count + 1;
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
            gender: true
          }
        },
        specialty: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true
          }
        }
      }
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
    const body = await request.json();
    const { patientId, specialtyId, doctorId, appointmentDate, status, notes } = body;

    // Verificar que la cita existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Si se está actualizando la fecha, verificar que no haya conflicto
    if (appointmentDate) {
      const newDate = new Date(appointmentDate);
      const finalPatientId = patientId || existingAppointment.patientId;
      
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          patientId: finalPatientId,
          appointmentDate: newDate,
          status: {
            not: 'cancelado'
          },
          id: {
            not: id
          }
        }
      });

      if (conflictingAppointment) {
        return NextResponse.json(
          { error: 'El paciente ya tiene una cita programada para esta fecha y hora' },
          { status: 409 }
        );
      }
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(patientId && { patientId }),
        ...(specialtyId && { specialtyId }),
        ...(doctorId !== undefined && { doctorId: doctorId || null }),
        ...(appointmentDate && { appointmentDate: new Date(appointmentDate) }),
        ...(status && { status }),
        ...(notes !== undefined && { notes: notes?.trim() || null })
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
            phone: true
          }
        },
        specialty: {
          select: {
            id: true,
            name: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(updatedAppointment);
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
    const body: UpdateAppointmentData = await request.json();
    const { patientId, specialtyId, doctorId, appointmentDate, status, notes } = body;

    // Verificar si la cita existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Si se está actualizando el paciente, verificar que existe
    if (patientId && patientId !== existingAppointment.patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId }
      });

      if (!patient) {
        return NextResponse.json(
          { error: 'Paciente no encontrado' },
          { status: 404 }
        );
      }
    }

    // Si se está actualizando la especialidad, verificar que existe
    if (specialtyId && specialtyId !== existingAppointment.specialtyId) {
      const specialty = await prisma.specialty.findUnique({
        where: { id: specialtyId }
      });

      if (!specialty) {
        return NextResponse.json(
          { error: 'Especialidad no encontrada' },
          { status: 404 }
        );
      }
    }

    // Si se está actualizando la fecha, verificar que no haya conflicto
    if (appointmentDate) {
      const newDate = new Date(appointmentDate);
      const finalPatientId = patientId || existingAppointment.patientId;
      
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          patientId: finalPatientId,
          appointmentDate: newDate,
          status: {
            not: 'cancelado'
          },
          id: {
            not: id
          }
        }
      });

      if (conflictingAppointment) {
        return NextResponse.json(
          { error: 'El paciente ya tiene una cita programada para esta fecha y hora' },
          { status: 409 }
        );
      }
    }

    // Si el estado cambia a "pendiente", asignar número de turno
    let turnNumber = existingAppointment.turnNumber;
    const finalSpecialtyId = specialtyId || existingAppointment.specialtyId;
    const finalAppointmentDate = appointmentDate ? new Date(appointmentDate) : existingAppointment.appointmentDate;

    if (status === 'pendiente' && existingAppointment.status !== 'pendiente') {
      // Si está pasando a pendiente, asignar número de turno
      turnNumber = await assignTurnNumber(finalSpecialtyId, finalAppointmentDate);
    } else if (status && status !== 'pendiente' && existingAppointment.status === 'pendiente') {
      // Si está saliendo de pendiente, limpiar el número de turno
      turnNumber = null;
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(patientId && { patientId }),
        ...(specialtyId && { specialtyId }),
        ...(doctorId !== undefined && { doctorId: doctorId || null }),
        ...(appointmentDate && { appointmentDate: new Date(appointmentDate) }),
        ...(status && { status }),
        ...(turnNumber !== undefined && { turnNumber }),
        ...(notes !== undefined && { notes: notes?.trim() || null })
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
            phone: true
          }
        },
        specialty: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json(updatedAppointment);
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

    // Verificar si la cita existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si la cita ya está cancelada
    if (existingAppointment.status === 'cancelado') {
      return NextResponse.json(
        { error: 'La cita ya está cancelada' },
        { status: 409 }
      );
    }

    // Verificar si la cita ya está completada
    if (existingAppointment.status === 'completado') {
      return NextResponse.json(
        { error: 'No se puede cancelar una cita ya completada' },
        { status: 409 }
      );
    }

    // Cancelar la cita
    await prisma.appointment.update({
      where: { id },
      data: {
        status: 'cancelado'
      }
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
