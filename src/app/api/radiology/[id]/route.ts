import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/radiology/[id] - Obtener una orden de radiología específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const order = await prisma.radiologyOrder.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
            birthDate: true,
            gender: true,
            phone: true,
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

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error al obtener orden de radiología:', error);
    return NextResponse.json(
      { error: 'Error al obtener orden de radiología' },
      { status: 500 }
    );
  }
}

// PATCH /api/radiology/[id] - Actualizar una orden de radiología
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, findings, diagnosis, images, notes } = body;

    // Verificar que la orden existe
    const existingOrder = await prisma.radiologyOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Preparar datos de actualización
    const updateData: {
      status?: string;
      findings?: string;
      diagnosis?: string;
      images?: string;
      notes?: string;
      performedBy?: string;
      completedAt?: Date;
    } = {};

    if (status) {
      updateData.status = status;
      
      // Si se marca como completado, guardar fecha y radiólogo
      if (status === 'completed') {
        updateData.completedAt = new Date();
        updateData.performedBy = session.user.id;
      }
    }

    if (findings !== undefined) updateData.findings = findings;
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (images !== undefined) updateData.images = images;
    if (notes !== undefined) updateData.notes = notes;

    // Actualizar la orden
    const updatedOrder = await prisma.radiologyOrder.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error al actualizar orden de radiología:', error);
    return NextResponse.json(
      { error: 'Error al actualizar orden de radiología' },
      { status: 500 }
    );
  }
}

// DELETE /api/radiology/[id] - Cancelar una orden de radiología
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que la orden existe
    const existingOrder = await prisma.radiologyOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // No permitir cancelar órdenes completadas
    if (existingOrder.status === 'completed') {
      return NextResponse.json(
        { error: 'No se puede cancelar una orden completada' },
        { status: 400 }
      );
    }

    // Actualizar estado a cancelado
    const cancelledOrder = await prisma.radiologyOrder.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ 
      message: 'Orden cancelada exitosamente',
      order: cancelledOrder 
    });
  } catch (error) {
    console.error('Error al cancelar orden de radiología:', error);
    return NextResponse.json(
      { error: 'Error al cancelar orden de radiología' },
      { status: 500 }
    );
  }
}

