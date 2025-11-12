import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateMedicationControlData } from '@/types/hospitalization';

// POST /api/hospitalizations/[id]/medication-controls - Crear nuevo control de medicamentos
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario tenga permisos
    if (!["admin", "recepcion", "especialista"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: hospitalizationId } = await params;
    const body: CreateMedicationControlData = await request.json();

    // Verificar que la hospitalización existe
    const hospitalization = await prisma.hospitalization.findUnique({
      where: { id: hospitalizationId },
      select: { id: true, status: true }
    });

    if (!hospitalization) {
      return NextResponse.json(
        { error: 'Hospitalización no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la hospitalización esté activa
    if (hospitalization.status !== 'iniciada') {
      return NextResponse.json(
        { error: 'Solo se pueden registrar medicamentos en hospitalizaciones activas' },
        { status: 400 }
      );
    }

    // Verificar que hay al menos un item
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Debe agregar al menos un medicamento o servicio' },
        { status: 400 }
      );
    }

    // Validar items
    for (const item of body.items) {
      if (!item.serviceItemId && !item.medicationNameId) {
        return NextResponse.json(
          { error: 'Cada medicamento debe tener un servicio asociado o un nombre del catálogo' },
          { status: 400 }
        );
      }

      if (item.medicationNameId) {
        const medicationName = await prisma.medicationName.findUnique({
          where: { id: item.medicationNameId },
          select: { id: true },
        });

        if (!medicationName) {
          return NextResponse.json(
            { error: 'Nombre de medicamento no válido' },
            { status: 400 }
          );
        }
      }

      if (item.serviceItemId) {
        const serviceItem = await prisma.serviceItem.findUnique({
          where: { id: item.serviceItemId },
          select: { id: true },
        });

        if (!serviceItem) {
          return NextResponse.json(
            { error: 'Servicio no válido para el medicamento' },
            { status: 400 }
          );
        }
      }
    }

    // Crear el control de medicamentos con sus items
    const medicationControl = await prisma.medicationControl.create({
      data: {
        hospitalizationId,
        notes: null,
        items: {
          create: body.items.map(item => ({
            serviceItemId: item.serviceItemId || null,
            variantId: item.variantId || null,
            medicationNameId: item.medicationNameId || null,
            quantity: item.quantity,
            notes: null,
          })),
        },
      },
      include: {
        items: {
          include: {
            serviceItem: true,
            variant: true,
            medicationName: true,
          },
        },
      },
    });

    return NextResponse.json(medicationControl, { status: 201 });

  } catch (error) {
    console.error('Error al crear control de medicamentos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/hospitalizations/[id]/medication-controls - Obtener controles de medicamentos
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: hospitalizationId } = await params;

    // Verificar que la hospitalización existe
    const hospitalization = await prisma.hospitalization.findUnique({
      where: { id: hospitalizationId },
      select: { id: true }
    });

    if (!hospitalization) {
      return NextResponse.json(
        { error: 'Hospitalización no encontrada' },
        { status: 404 }
      );
    }

    // Obtener todos los controles de medicamentos
    const medicationControls = await prisma.medicationControl.findMany({
      where: { hospitalizationId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            serviceItem: true,
            variant: true,
            medicationName: true,
          },
        },
      },
    });

    return NextResponse.json(medicationControls);

  } catch (error) {
    console.error('Error al obtener controles de medicamentos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

