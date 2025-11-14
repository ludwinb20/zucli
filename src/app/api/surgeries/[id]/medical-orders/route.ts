import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateSurgeryMedicalOrdersData } from '@/types/surgery';

// POST /api/surgeries/[id]/medical-orders - Crear órdenes y anotaciones
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!["admin", "especialista", "recepcion", "medico_sala"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: surgeryId } = await params;
    const body: CreateSurgeryMedicalOrdersData = await request.json();

    // Verificar que la cirugía existe
    const surgery = await prisma.surgery.findUnique({
      where: { id: surgeryId }
    });

    if (!surgery) {
      return NextResponse.json(
        { error: 'Cirugía no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que no exista ya
    const existing = await prisma.surgeryMedicalOrders.findUnique({
      where: { surgeryId }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existen órdenes y anotaciones para esta cirugía' },
        { status: 400 }
      );
    }

    // Validar que haya al menos una anotación u orden
    const hasAnotaciones = body.anotaciones && body.anotaciones.length > 0 && body.anotaciones.some(a => a.trim());
    const hasOrdenes = body.ordenes && body.ordenes.length > 0 && body.ordenes.some(o => o.trim());

    if (!hasAnotaciones && !hasOrdenes) {
      return NextResponse.json(
        { error: 'Debe agregar al menos una anotación u orden' },
        { status: 400 }
      );
    }

    // Crear el registro de órdenes y anotaciones
    const medicalOrders = await prisma.surgeryMedicalOrders.create({
      data: {
        surgeryId,
        anotaciones: {
          create: (body.anotaciones || [])
            .filter(content => content.trim())
            .map(content => ({ content: content.trim() }))
        },
        ordenes: {
          create: (body.ordenes || [])
            .filter(content => content.trim())
            .map(content => ({ content: content.trim() }))
        }
      },
      include: {
        anotaciones: {
          orderBy: { createdAt: 'asc' }
        },
        ordenes: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json(medicalOrders, { status: 201 });

  } catch (error) {
    console.error('Error al crear órdenes y anotaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/surgeries/[id]/medical-orders - Actualizar órdenes y anotaciones
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!["admin", "especialista", "recepcion", "medico_sala"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: surgeryId } = await params;
    const body: CreateSurgeryMedicalOrdersData = await request.json();

    // Verificar que existe
    const existing = await prisma.surgeryMedicalOrders.findUnique({
      where: { surgeryId }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Órdenes y anotaciones no encontradas' },
        { status: 404 }
      );
    }

    // Eliminar anotaciones y órdenes existentes
    await prisma.surgeryAnnotation.deleteMany({
      where: { surgeryMedicalOrdersId: existing.id }
    });
    await prisma.surgeryOrder.deleteMany({
      where: { surgeryMedicalOrdersId: existing.id }
    });

    // Crear nuevas anotaciones y órdenes
    const medicalOrders = await prisma.surgeryMedicalOrders.update({
      where: { surgeryId },
      data: {
        anotaciones: {
          create: (body.anotaciones || [])
            .filter(content => content.trim())
            .map(content => ({ content: content.trim() }))
        },
        ordenes: {
          create: (body.ordenes || [])
            .filter(content => content.trim())
            .map(content => ({ content: content.trim() }))
        }
      },
      include: {
        anotaciones: {
          orderBy: { createdAt: 'asc' }
        },
        ordenes: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    return NextResponse.json(medicalOrders);

  } catch (error) {
    console.error('Error al actualizar órdenes y anotaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/surgeries/[id]/medical-orders - Obtener órdenes y anotaciones
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: surgeryId } = await params;

    const medicalOrders = await prisma.surgeryMedicalOrders.findUnique({
      where: { surgeryId },
      include: {
        anotaciones: {
          orderBy: { createdAt: 'asc' }
        },
        ordenes: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!medicalOrders) {
      return NextResponse.json(
        { error: 'Órdenes y anotaciones no encontradas' },
        { status: 404 }
      );
    }

    return NextResponse.json(medicalOrders);

  } catch (error) {
    console.error('Error al obtener órdenes y anotaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

