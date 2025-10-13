import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateAppointmentData } from '@/types/appointments';

// GET /api/appointments - Obtener todas las citas con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const specialtyId = searchParams.get('specialtyId');
    const patientId = searchParams.get('patientId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '100'); // Límite por defecto: 100
    const page = parseInt(searchParams.get('page') || '1'); // Página por defecto: 1
    const offset = (page - 1) * limit;

    // Construir filtros
    const where: { status?: string, specialtyId?: string, patientId?: string, appointmentDate?: { gte?: Date, lte?: Date } } = {};

    if (status) {
      where.status = status;
    }

    if (specialtyId) {
      where.specialtyId = specialtyId;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (dateFrom || dateTo) {
      where.appointmentDate = {};
      if (dateFrom) {
        where.appointmentDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.appointmentDate.lte = new Date(dateTo);
      }
    }

    // Obtener el total de registros para la paginación
    const totalCount = await prisma.appointment.count({ where });

    // Obtener las citas con paginación
    const appointments = await prisma.appointment.findMany({
      where,
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
      },
      orderBy: {
        appointmentDate: 'asc'
      },
      take: limit,
      skip: offset
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      appointments,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Error al obtener las citas' },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Crear nueva cita
export async function POST(request: NextRequest) {
  try {
    const body: CreateAppointmentData = await request.json();
    const { patientId, specialtyId, appointmentDate, status = 'programado', notes } = body;

    // Validaciones
    if (!patientId || !specialtyId || !appointmentDate) {
      return NextResponse.json(
        { error: 'Los campos paciente, especialidad y fecha son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que la especialidad existe
    const specialty = await prisma.specialty.findUnique({
      where: { id: specialtyId }
    });

    if (!specialty) {
      return NextResponse.json(
        { error: 'Especialidad no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que no haya una cita duplicada para el mismo paciente en la misma fecha y hora
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        appointmentDate: new Date(appointmentDate),
        status: {
          not: 'cancelado'
        }
      }
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'El paciente ya tiene una cita programada para esta fecha y hora' },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        specialtyId,
        appointmentDate: new Date(appointmentDate),
        status,
        notes: notes?.trim() || null
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

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Error al crear la cita' },
      { status: 500 }
    );
  }
}
