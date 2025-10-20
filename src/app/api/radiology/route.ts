import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/radiology - Obtener órdenes de radiología
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: {
      patientId?: string;
      status?: string;
      OR?: Array<{
        patient?: {
          OR?: Array<{
            firstName?: { contains: string };
            lastName?: { contains: string };
            identityNumber?: { contains: string };
          }>;
        };
      }>;
    } = {};

    if (patientId) {
      where.patientId = patientId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          patient: {
            OR: [
              { firstName: { contains: search } },
              { lastName: { contains: search } },
              { identityNumber: { contains: search } },
            ],
          },
        },
      ];
    }

    // Obtener total de registros
    const totalCount = await prisma.radiologyOrder.count({ where });

    // Obtener órdenes con paginación
    const ordersFromDB = await prisma.radiologyOrder.findMany({
      where,
      select: {
        id: true,
        patientId: true,
        paymentId: true,
        status: true,
        findings: true,
        diagnosis: true,
        images: true,
        performedBy: true,
        notes: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
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
        payment: {
          include: {
            sale: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Obtener los items de cada orden
    const saleIds = ordersFromDB
      .map(order => order.payment.sale?.id)
      .filter((id): id is string => id !== null && id !== undefined);

    const transactionItems = await prisma.transactionItem.findMany({
      where: {
        sourceType: 'sale',
        sourceId: {
          in: saleIds,
        },
      },
      select: {
        id: true,
        sourceId: true,
        nombre: true,
        quantity: true,
        precioUnitario: true,
        total: true,
      },
    });

    // Mapear items a cada orden
    const orders = ordersFromDB.map(order => ({
      ...order,
      payment: {
        ...order.payment,
        sale: order.payment.sale ? {
          ...order.payment.sale,
          transactionItems: transactionItems.filter(
            item => item.sourceId === order.payment.sale?.id
          ),
        } : null,
      },
    }));

    // Calcular paginación
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit,
      },
    });
  } catch (error) {
    console.error('Error al obtener órdenes de radiología:', error);
    return NextResponse.json(
      { error: 'Error al obtener órdenes de radiología' },
      { status: 500 }
    );
  }
}

// POST /api/radiology - Crear nueva orden de radiología (automático desde pagos)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, paymentId, notes } = body;

    // Validar campos requeridos
    if (!patientId || !paymentId) {
      return NextResponse.json(
        { error: 'patientId y paymentId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el pago existe
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // Verificar que no exista ya una orden para este pago
    const existingOrder = await prisma.radiologyOrder.findUnique({
      where: { paymentId },
    });

    if (existingOrder) {
      return NextResponse.json(
        { error: 'Ya existe una orden de radiología para este pago' },
        { status: 400 }
      );
    }

    // Crear la orden de radiología
    const order = await prisma.radiologyOrder.create({
      data: {
        patientId,
        paymentId,
        status: 'pending',
        notes,
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
        payment: {
          select: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error al crear orden de radiología:', error);
    return NextResponse.json(
      { error: 'Error al crear orden de radiología' },
      { status: 500 }
    );
  }
}

