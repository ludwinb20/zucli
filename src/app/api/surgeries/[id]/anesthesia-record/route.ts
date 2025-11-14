import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateAnesthesiaRecordData } from '@/types/surgery';

// POST /api/surgeries/[id]/anesthesia-record - Crear registro de anestesia
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
    const body: CreateAnesthesiaRecordData = await request.json();

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

    // Verificar que no exista ya un registro de anestesia
    const existing = await prisma.anesthesiaRecord.findUnique({
      where: { surgeryId }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un registro de anestesia para esta cirugía' },
        { status: 400 }
      );
    }

    // Crear el registro de anestesia
    const anesthesiaRecord = await prisma.anesthesiaRecord.create({
      data: {
        surgeryId,
        premedicacion: body.premedicacion || "",
        estadoFisico: body.estadoFisico || "",
        pronosticoOperatorio: body.pronosticoOperatorio || "",
        agentesTecnicas: body.agentesTecnicas || "",
        resumenLiquidos: body.resumenLiquidos || "",
        tiempoDuracionAnestesia: body.tiempoDuracionAnestesia || "",
        operacion: body.operacion || "",
        cirujano: body.cirujano || "",
        complicaciones: body.complicaciones || "",
        anestesiologo: body.anestesiologo || "",
        gridData: body.gridData || "",
      }
    });

    return NextResponse.json(anesthesiaRecord, { status: 201 });

  } catch (error) {
    console.error('Error al crear registro de anestesia:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/surgeries/[id]/anesthesia-record - Obtener registro de anestesia
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

    const anesthesiaRecord = await prisma.anesthesiaRecord.findUnique({
      where: { surgeryId }
    });

    return NextResponse.json(anesthesiaRecord);

  } catch (error) {
    console.error('Error al obtener registro de anestesia:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/surgeries/[id]/anesthesia-record - Actualizar registro de anestesia
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
    const body: CreateAnesthesiaRecordData = await request.json();

    // Buscar el registro existente
    const existing = await prisma.anesthesiaRecord.findUnique({
      where: { surgeryId }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'No existe un registro de anestesia para esta cirugía' },
        { status: 404 }
      );
    }

    // Actualizar el registro de anestesia
    const anesthesiaRecord = await prisma.anesthesiaRecord.update({
      where: { id: existing.id },
      data: {
        premedicacion: body.premedicacion || "",
        estadoFisico: body.estadoFisico || "",
        pronosticoOperatorio: body.pronosticoOperatorio || "",
        agentesTecnicas: body.agentesTecnicas || "",
        resumenLiquidos: body.resumenLiquidos || "",
        tiempoDuracionAnestesia: body.tiempoDuracionAnestesia || "",
        operacion: body.operacion || "",
        cirujano: body.cirujano || "",
        complicaciones: body.complicaciones || "",
        anestesiologo: body.anestesiologo || "",
        gridData: body.gridData || "",
      }
    });

    return NextResponse.json(anesthesiaRecord);

  } catch (error) {
    console.error('Error al actualizar registro de anestesia:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
