import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateSafetyChecklistSalidaData } from '@/types/surgery';

// POST /api/surgeries/[id]/safety-checklist/salida - Crear salida de lista de verificación
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
    const body: CreateSafetyChecklistSalidaData = await request.json();

    // Buscar o crear SafetyChecklist
    let safetyChecklist = await prisma.safetyChecklist.findUnique({
      where: { surgeryId }
    });

    if (!safetyChecklist) {
      safetyChecklist = await prisma.safetyChecklist.create({
        data: { surgeryId }
      });
    }

    // Verificar que no exista ya una salida
    const existing = await prisma.safetyChecklistSalida.findUnique({
      where: { safetyChecklistId: safetyChecklist.id }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una salida de verificación para esta cirugía' },
        { status: 400 }
      );
    }

    // Crear salida
    const salida = await prisma.safetyChecklistSalida.create({
      data: {
        safetyChecklistId: safetyChecklist.id,
        nombreProcedimiento: body.nombreProcedimiento || false,
        conteoGasas: body.conteoGasas || false,
        conteoAgujas: body.conteoAgujas || false,
        identificacionMuestras: body.identificacionMuestras || false,
        problemasEquipo: body.problemasEquipo || false,
        profilaxisTromboembolia: body.profilaxisTromboembolia || false,
      }
    });

    return NextResponse.json(salida, { status: 201 });

  } catch (error) {
    console.error('Error al crear salida de verificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/surgeries/[id]/safety-checklist/salida - Actualizar salida
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
    const body: CreateSafetyChecklistSalidaData = await request.json();

    const safetyChecklist = await prisma.safetyChecklist.findUnique({
      where: { surgeryId }
    });

    if (!safetyChecklist) {
      return NextResponse.json(
        { error: 'Lista de verificación no encontrada' },
        { status: 404 }
      );
    }

    const existing = await prisma.safetyChecklistSalida.findUnique({
      where: { safetyChecklistId: safetyChecklist.id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Salida de verificación no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar
    const salida = await prisma.safetyChecklistSalida.update({
      where: { safetyChecklistId: safetyChecklist.id },
      data: {
        nombreProcedimiento: body.nombreProcedimiento !== undefined ? body.nombreProcedimiento : existing.nombreProcedimiento,
        conteoGasas: body.conteoGasas !== undefined ? body.conteoGasas : existing.conteoGasas,
        conteoAgujas: body.conteoAgujas !== undefined ? body.conteoAgujas : existing.conteoAgujas,
        identificacionMuestras: body.identificacionMuestras !== undefined ? body.identificacionMuestras : existing.identificacionMuestras,
        problemasEquipo: body.problemasEquipo !== undefined ? body.problemasEquipo : existing.problemasEquipo,
        profilaxisTromboembolia: body.profilaxisTromboembolia !== undefined ? body.profilaxisTromboembolia : existing.profilaxisTromboembolia,
      }
    });

    return NextResponse.json(salida);

  } catch (error) {
    console.error('Error al actualizar salida de verificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/surgeries/[id]/safety-checklist/salida - Obtener salida
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
        salida: true
      }
    });

    if (!safetyChecklist?.salida) {
      return NextResponse.json(
        { error: 'Salida de verificación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(safetyChecklist.salida);

  } catch (error) {
    console.error('Error al obtener salida de verificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

