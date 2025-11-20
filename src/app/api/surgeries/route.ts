import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateSurgeryData } from '@/types/surgery';

// POST /api/surgeries - Crear nueva cirugía
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos
    if (!["admin", "recepcion", "especialista", "medico_sala"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const body: CreateSurgeryData = await request.json();

    // Validaciones
    if (!body.patientId) {
      return NextResponse.json(
        { error: 'Paciente es requerido' },
        { status: 400 }
      );
    }

    if (!body.nombre || !body.nombre.trim()) {
      return NextResponse.json(
        { error: 'El concepto de la cirugía es requerido' },
        { status: 400 }
      );
    }

    if (!body.precioUnitario || body.precioUnitario <= 0) {
      return NextResponse.json(
        { error: 'El precio unitario debe ser mayor a 0' },
        { status: 400 }
      );
    }

    const quantity = body.quantity || 1;
    if (quantity <= 0) {
      return NextResponse.json(
        { error: 'La cantidad debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: body.patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    // Si se proporciona surgeryItemId (opcional), verificar que existe
    let surgeryItem = null;
    if (body.surgeryItemId) {
      surgeryItem = await prisma.serviceItem.findUnique({
        where: { id: body.surgeryItemId },
        include: {
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      if (!surgeryItem) {
        return NextResponse.json(
          { error: 'Servicio de cirugía no encontrado' },
          { status: 404 }
        );
      }

      // Verificar que tiene el tag "cirugia" (opcional pero validar si se proporciona)
      const hasCirugiaTag = surgeryItem.tags.some(st => 
        st.tag.name.toLowerCase() === 'cirugias' || st.tag.name.toLowerCase() === 'cirugías'
      );

      if (!hasCirugiaTag) {
        return NextResponse.json(
          { error: 'El servicio seleccionado no es un servicio de cirugía' },
          { status: 400 }
        );
      }
    }

    // Calcular total
    const total = body.precioUnitario * quantity;

    // Crear la cirugía
    const surgery = await prisma.surgery.create({
      data: {
        patientId: body.patientId,
        surgeryItemId: body.surgeryItemId || null,
        status: 'iniciada'
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true
          }
        },
        surgeryItem: {
          select: {
            id: true,
            name: true,
            basePrice: true
          }
        }
      }
    });

    // Crear el Payment automáticamente con el TransactionItem como item variable
    const payment = await prisma.payment.create({
      data: {
        patientId: body.patientId,
        surgeryId: surgery.id,
        total: total,
        status: 'pendiente',
        notes: `Pago generado automáticamente para cirugía: ${body.nombre.trim()}`
      }
    });

    // Crear TransactionItem como item variable (isCustom: true, serviceItemId: null)
    await prisma.transactionItem.create({
      data: {
        sourceType: 'surgery',
        sourceId: surgery.id,
        serviceItemId: null, // Item variable no tiene serviceItemId
        variantId: null,
        quantity: quantity,
        isCustom: true, // Marcar como item variable
        nombre: body.nombre.trim(),
        precioUnitario: body.precioUnitario,
        descuento: 0,
        total: total,
        addedBy: session.user.id, // Quien creó la cirugía (doctor de sala o recepcionista)
        notes: `Servicio de cirugía: ${body.nombre.trim()}`
      }
    });

    // Si está relacionada con una hospitalización
    if (body.hospitalizationId) {
      // Verificar que la hospitalización existe
      const hospitalization = await prisma.hospitalization.findUnique({
        where: { id: body.hospitalizationId },
        select: { id: true, patientId: true, surgeryId: true }
      });

      if (!hospitalization) {
        return NextResponse.json(
          { error: 'Hospitalización no encontrada' },
          { status: 404 }
        );
      }

      if (hospitalization.patientId !== body.patientId) {
        return NextResponse.json(
          { error: 'La hospitalización no pertenece al mismo paciente' },
          { status: 400 }
        );
      }

      if (hospitalization.surgeryId) {
        return NextResponse.json(
          { error: 'La hospitalización ya está relacionada con otra cirugía' },
          { status: 400 }
        );
      }

      // Vincular la hospitalización a la cirugía
      await prisma.hospitalization.update({
        where: { id: body.hospitalizationId },
        data: { surgeryId: surgery.id }
      });
    }

    return NextResponse.json({ surgery, payment }, { status: 201 });

  } catch (error) {
    console.error('Error al crear cirugía:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/surgeries - Listar cirugías
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || 'all';
    const patientId = searchParams.get('patientId');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: {
      status?: string;
      patientId?: string;
      OR?: Array<{
        patient?: {
          OR?: Array<{
            firstName?: { contains: string; mode: 'insensitive' };
            lastName?: { contains: string; mode: 'insensitive' };
            identityNumber?: { contains: string; mode: 'insensitive' };
          }>;
        };
      }>;
    } = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (search) {
      where.OR = [
        {
          patient: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { identityNumber: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    // Obtener cirugías
    const [surgeries, total] = await Promise.all([
      prisma.surgery.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              identityNumber: true
            }
          },
          surgeryItem: {
            select: {
              id: true,
              name: true,
              basePrice: true
            }
          },
          payment: {
            select: {
              id: true,
              total: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.surgery.count({ where })
    ]);

    // Obtener TransactionItems para las cirugías (para mostrar el nombre cuando surgeryItem es null)
    const surgeriesWithItems = await Promise.all(
      surgeries.map(async (surgery) => {
        const transactionItem = await prisma.transactionItem.findFirst({
          where: {
            sourceType: 'surgery',
            sourceId: surgery.id
          },
          select: {
            nombre: true
          }
        });

        return {
          ...surgery,
          transactionItemName: transactionItem?.nombre || null
        };
      })
    );

    return NextResponse.json({
      surgeries: surgeriesWithItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error al obtener cirugías:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

