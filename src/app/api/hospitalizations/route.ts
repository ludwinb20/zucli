import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateDaysOfStay } from '@/lib/hospitalization-helpers';

// GET /api/hospitalizations - Listar hospitalizaciones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    const search = searchParams.get('search');
    const withoutPayments = searchParams.get('withoutPayments') === 'true';

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: {
      status?: string;
      patientId?: string;
      id?: { notIn?: string[] };
      OR?: Array<{
        patient?: {
          firstName?: { contains: string; mode: 'insensitive' };
          lastName?: { contains: string; mode: 'insensitive' };
          identityNumber?: { contains: string };
        };
      }>;
    } = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (search) {
      where.OR = [
        {
          patient: {
            firstName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          patient: {
            lastName: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          patient: {
            identityNumber: {
              contains: search,
            },
          },
        },
      ];
    }

    // Si se solicita solo hospitalizaciones sin pagos
    if (withoutPayments) {
      // Obtener IDs de hospitalizaciones que tienen pagos activos
      const hospitalizationsWithPayments = await prisma.payment.findMany({
        where: {
          hospitalizationId: { not: null },
          isActive: true,
          status: { not: 'cancelado' },
        },
        select: {
          hospitalizationId: true,
        },
        distinct: ['hospitalizationId'],
      });

      const hospitalizationIdsWithPayments = hospitalizationsWithPayments
        .map(p => p.hospitalizationId)
        .filter((id): id is string => id !== null);

      // Filtrar solo hospitalizaciones activas que NO tienen pagos
      where.status = 'iniciada';
      where.id = {
        notIn: hospitalizationIdsWithPayments,
      };
    }

    // Contar total
    const totalCount = await prisma.hospitalization.count({ where });

    // Obtener hospitalizaciones
    const hospitalizations = await prisma.hospitalization.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
            birthDate: true,
            gender: true,
          },
        },
        medicoSalaUser: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        room: true,
        dailyRateItem: {
          include: {
            variants: {
              where: {
                isActive: true,
              },
              orderBy: {
                name: 'asc',
              },
              select: {
                id: true,
                name: true,
                price: true,
                isActive: true,
              },
            },
          },
        },
        dailyRateVariant: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        preclinicas: {
          select: {
            id: true,
            createdAt: true,
            presionArterial: true,
            temperatura: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Calcular días de estancia para cada hospitalización
    const hospitalizationsWithDays = hospitalizations.map((hosp) => ({
      ...hosp,
      daysOfStay: calculateDaysOfStay(hosp.admissionDate, hosp.dischargeDate),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      hospitalizations: hospitalizationsWithDays,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error('Error al obtener hospitalizaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener hospitalizaciones' },
      { status: 500 }
    );
  }
}

// POST /api/hospitalizations - Crear nueva hospitalización
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, medicoSalaUserId, roomId, surgeryId, dailyRateItemId, dailyRateVariantId, diagnosis, notes } = body;

    // Validar campos requeridos
    if (!patientId) {
      return NextResponse.json(
        { error: 'Paciente es requerido' },
        { status: 400 }
      );
    }

    // Si el usuario es medico_sala, usar su ID automáticamente
    let finalMedicoSalaUserId = medicoSalaUserId;
    if (session.user.role?.name === 'medico_sala' && !medicoSalaUserId) {
      finalMedicoSalaUserId = session.user.id;
    }

    // Validar médico de sala (solo si no es medico_sala)
    if (session.user.role?.name !== 'medico_sala' && !finalMedicoSalaUserId) {
      return NextResponse.json(
        { error: 'Médico de sala es requerido' },
        { status: 400 }
      );
    }

    // Si se asigna habitación, verificar que esté disponible
    if (roomId) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
      });

      if (!room) {
        return NextResponse.json(
          { error: 'Habitación no encontrada' },
          { status: 404 }
        );
      }

      if (room.status === 'occupied') {
        return NextResponse.json(
          { error: 'La habitación ya está ocupada' },
          { status: 400 }
        );
      }
    }

    // Crear hospitalización
    const hospitalization = await prisma.hospitalization.create({
      data: {
        patientId,
        medicoSalaUserId: finalMedicoSalaUserId,
        roomId,
        surgeryId,
        dailyRateItemId,
        dailyRateVariantId,
        diagnosis,
        notes,
        status: 'iniciada',
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
            birthDate: true,
            gender: true,
          },
        },
        medicoSalaUser: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        room: true,
        dailyRateItem: {
          select: {
            id: true,
            name: true,
            basePrice: true,
          },
        },
        dailyRateVariant: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        preclinicas: true,
      },
    });

    // Si se asignó habitación, actualizar su status a ocupada
    if (roomId) {
      await prisma.room.update({
        where: { id: roomId },
        data: { status: 'occupied' },
      });
    }

    // NO crear pago al momento de crear la hospitalización
    // El pago se creará cuando se facturen días (pago parcial o al dar de alta)
    // Esto evita crear pagos con total 0 que aparecen en la vista de caja

    return NextResponse.json(hospitalization, { status: 201 });
  } catch (error) {
    console.error('Error al crear hospitalización:', error);
    return NextResponse.json(
      { error: 'Error al crear hospitalización' },
      { status: 500 }
    );
  }
}

