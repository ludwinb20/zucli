import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateSafetyChecklistPausaData } from '@/types/surgery';

// POST /api/surgeries/[id]/safety-checklist/pausa - Crear pausa de lista de verificación
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: surgeryId } = await params;
    const body: CreateSafetyChecklistPausaData = await request.json();

    // Buscar o crear SafetyChecklist
    let safetyChecklist = await prisma.safetyChecklist.findUnique({
      where: { surgeryId }
    });

    if (!safetyChecklist) {
      safetyChecklist = await prisma.safetyChecklist.create({
        data: { surgeryId }
      });
    }

    // Verificar que no exista ya una pausa
    const existing = await prisma.safetyChecklistPausa.findUnique({
      where: { safetyChecklistId: safetyChecklist.id }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una pausa de verificación para esta cirugía' },
        { status: 400 }
      );
    }

    // Crear pausa
    const pausa = await prisma.safetyChecklistPausa.create({
      data: {
        safetyChecklistId: safetyChecklist.id,
        confirmacionEquipo: body.confirmacionEquipo || false,
        confirmaPaciente: body.confirmaPaciente || false,
        confirmaSitio: body.confirmaSitio || false,
        confirmaProcedimiento: body.confirmaProcedimiento || false,
        pasosCriticos: body.pasosCriticos?.trim() || null,
        preocupacionesAnestesia: body.preocupacionesAnestesia?.trim() || null,
      }
    });

    return NextResponse.json(pausa, { status: 201 });

  } catch (error) {
    console.error('Error al crear pausa de verificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/surgeries/[id]/safety-checklist/pausa - Actualizar pausa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: surgeryId } = await params;
    const body: CreateSafetyChecklistPausaData = await request.json();

    const safetyChecklist = await prisma.safetyChecklist.findUnique({
      where: { surgeryId }
    });

    if (!safetyChecklist) {
      return NextResponse.json(
        { error: 'Lista de verificación no encontrada' },
        { status: 404 }
      );
    }

    const existing = await prisma.safetyChecklistPausa.findUnique({
      where: { safetyChecklistId: safetyChecklist.id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Pausa de verificación no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar
    const pausa = await prisma.safetyChecklistPausa.update({
      where: { safetyChecklistId: safetyChecklist.id },
      data: {
        confirmacionEquipo: body.confirmacionEquipo !== undefined ? body.confirmacionEquipo : existing.confirmacionEquipo,
        confirmaPaciente: body.confirmaPaciente !== undefined ? body.confirmaPaciente : existing.confirmaPaciente,
        confirmaSitio: body.confirmaSitio !== undefined ? body.confirmaSitio : existing.confirmaSitio,
        confirmaProcedimiento: body.confirmaProcedimiento !== undefined ? body.confirmaProcedimiento : existing.confirmaProcedimiento,
        pasosCriticos: body.pasosCriticos !== undefined ? (body.pasosCriticos?.trim() || null) : existing.pasosCriticos,
        preocupacionesAnestesia: body.preocupacionesAnestesia !== undefined ? (body.preocupacionesAnestesia?.trim() || null) : existing.preocupacionesAnestesia,
      }
    });

    return NextResponse.json(pausa);

  } catch (error) {
    console.error('Error al actualizar pausa de verificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/surgeries/[id]/safety-checklist/pausa - Obtener pausa
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

    const safetyChecklist = await prisma.safetyChecklist.findUnique({
      where: { surgeryId },
      include: {
        pausa: true
      }
    });

    if (!safetyChecklist?.pausa) {
      return NextResponse.json(
        { error: 'Pausa de verificación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(safetyChecklist.pausa);

  } catch (error) {
    console.error('Error al obtener pausa de verificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

