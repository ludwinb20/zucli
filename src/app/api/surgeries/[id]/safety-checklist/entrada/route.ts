import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateSafetyChecklistEntradaData } from '@/types/surgery';

// POST /api/surgeries/[id]/safety-checklist/entrada - Crear entrada de lista de verificación
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
    const body: CreateSafetyChecklistEntradaData = await request.json();

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

    // Buscar o crear SafetyChecklist
    let safetyChecklist = await prisma.safetyChecklist.findUnique({
      where: { surgeryId }
    });

    if (!safetyChecklist) {
      safetyChecklist = await prisma.safetyChecklist.create({
        data: { surgeryId }
      });
    }

    // Verificar que no exista ya una entrada
    const existing = await prisma.safetyChecklistEntrada.findUnique({
      where: { safetyChecklistId: safetyChecklist.id }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una entrada de verificación para esta cirugía' },
        { status: 400 }
      );
    }

    // Crear entrada
    const entrada = await prisma.safetyChecklistEntrada.create({
      data: {
        safetyChecklistId: safetyChecklist.id,
        confirmaIdentidad: body.confirmaIdentidad || false,
        confirmaLocalizacion: body.confirmaLocalizacion || false,
        confirmaProcedimiento: body.confirmaProcedimiento || false,
        confirmaConsentimiento: body.confirmaConsentimiento || false,
        confirmaMarca: body.confirmaMarca || false,
        verificacionSeguridad: body.verificacionSeguridad || false,
        alergiasConocidas: body.alergiasConocidas || false,
        detallesAlergias: body.detallesAlergias?.trim() || null,
        dificultadViaArea: body.dificultadViaArea || false,
        accesoIVAdecuado: body.accesoIVAdecuado || false,
        esterilidad: body.esterilidad || false,
        profilaxisAntibiotica: body.profilaxisAntibiotica || false,
        imagenesEsenciales: body.imagenesEsenciales || false,
      }
    });

    return NextResponse.json(entrada, { status: 201 });

  } catch (error) {
    console.error('Error al crear entrada de verificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/surgeries/[id]/safety-checklist/entrada - Actualizar entrada
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
    const body: CreateSafetyChecklistEntradaData = await request.json();

    // Buscar SafetyChecklist
    const safetyChecklist = await prisma.safetyChecklist.findUnique({
      where: { surgeryId }
    });

    if (!safetyChecklist) {
      return NextResponse.json(
        { error: 'Lista de verificación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que existe entrada
    const existing = await prisma.safetyChecklistEntrada.findUnique({
      where: { safetyChecklistId: safetyChecklist.id }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Entrada de verificación no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar
    const entrada = await prisma.safetyChecklistEntrada.update({
      where: { safetyChecklistId: safetyChecklist.id },
      data: {
        confirmaIdentidad: body.confirmaIdentidad !== undefined ? body.confirmaIdentidad : existing.confirmaIdentidad,
        confirmaLocalizacion: body.confirmaLocalizacion !== undefined ? body.confirmaLocalizacion : existing.confirmaLocalizacion,
        confirmaProcedimiento: body.confirmaProcedimiento !== undefined ? body.confirmaProcedimiento : existing.confirmaProcedimiento,
        confirmaConsentimiento: body.confirmaConsentimiento !== undefined ? body.confirmaConsentimiento : existing.confirmaConsentimiento,
        confirmaMarca: body.confirmaMarca !== undefined ? body.confirmaMarca : existing.confirmaMarca,
        verificacionSeguridad: body.verificacionSeguridad !== undefined ? body.verificacionSeguridad : existing.verificacionSeguridad,
        alergiasConocidas: body.alergiasConocidas !== undefined ? body.alergiasConocidas : existing.alergiasConocidas,
        detallesAlergias: body.detallesAlergias !== undefined ? (body.detallesAlergias?.trim() || null) : existing.detallesAlergias,
        dificultadViaArea: body.dificultadViaArea !== undefined ? body.dificultadViaArea : existing.dificultadViaArea,
        accesoIVAdecuado: body.accesoIVAdecuado !== undefined ? body.accesoIVAdecuado : existing.accesoIVAdecuado,
        esterilidad: body.esterilidad !== undefined ? body.esterilidad : existing.esterilidad,
        profilaxisAntibiotica: body.profilaxisAntibiotica !== undefined ? body.profilaxisAntibiotica : existing.profilaxisAntibiotica,
        imagenesEsenciales: body.imagenesEsenciales !== undefined ? body.imagenesEsenciales : existing.imagenesEsenciales,
      }
    });

    return NextResponse.json(entrada);

  } catch (error) {
    console.error('Error al actualizar entrada de verificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/surgeries/[id]/safety-checklist/entrada - Obtener entrada
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
        entrada: true
      }
    });

    if (!safetyChecklist?.entrada) {
      return NextResponse.json(
        { error: 'Entrada de verificación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(safetyChecklist.entrada);

  } catch (error) {
    console.error('Error al obtener entrada de verificación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

