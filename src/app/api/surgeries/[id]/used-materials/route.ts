import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateUsedMaterialsData } from '@/types/surgery';

// POST /api/surgeries/[id]/used-materials - Crear materiales utilizados
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!["admin", "especialista", "recepcion"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: surgeryId } = await params;
    const body: CreateUsedMaterialsData = await request.json();

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
    const existing = await prisma.usedMaterials.findUnique({
      where: { surgeryId }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un registro de materiales utilizados para esta cirugía' },
        { status: 400 }
      );
    }

    // Crear registro de materiales
    const usedMaterials = await prisma.usedMaterials.create({
      data: {
        surgeryId,
        gasas: body.gasas?.trim() || null,
        torundas: body.torundas?.trim() || null,
        compresas: body.compresas?.trim() || null,
        aseptosan: body.aseptosan?.trim() || null,
        cloruro: body.cloruro?.trim() || null,
        povedine: body.povedine?.trim() || null,
        sondaFoley: body.sondaFoley?.trim() || null,
        bolsaRecolectoraOrina: body.bolsaRecolectoraOrina?.trim() || null,
        bisturiNo: body.bisturiNo?.trim() || null,
        guantesEsterilesTallas: body.guantesEsterilesTallas?.trim() || null,
        suturas: body.suturas?.trim() || null,
        espadadraspo: body.espadadraspo?.trim() || null,
        jeringas: body.jeringas?.trim() || null,
        bolsaMuestraBiopsia: body.bolsaMuestraBiopsia?.trim() || null,
        manigtas: body.manigtas?.trim() || null,
        lubricante: body.lubricante?.trim() || null,
        otros: body.otros?.trim() || null,
      }
    });

    return NextResponse.json(usedMaterials, { status: 201 });

  } catch (error) {
    console.error('Error al crear materiales utilizados:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/surgeries/[id]/used-materials - Actualizar materiales
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!["admin", "especialista", "recepcion"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: surgeryId } = await params;
    const body: CreateUsedMaterialsData = await request.json();

    // Verificar que existe
    const existing = await prisma.usedMaterials.findUnique({
      where: { surgeryId }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Materiales utilizados no encontrados' },
        { status: 404 }
      );
    }

    // Actualizar
    const usedMaterials = await prisma.usedMaterials.update({
      where: { surgeryId },
      data: {
        gasas: body.gasas?.trim() || null,
        torundas: body.torundas?.trim() || null,
        compresas: body.compresas?.trim() || null,
        aseptosan: body.aseptosan?.trim() || null,
        cloruro: body.cloruro?.trim() || null,
        povedine: body.povedine?.trim() || null,
        sondaFoley: body.sondaFoley?.trim() || null,
        bolsaRecolectoraOrina: body.bolsaRecolectoraOrina?.trim() || null,
        bisturiNo: body.bisturiNo?.trim() || null,
        guantesEsterilesTallas: body.guantesEsterilesTallas?.trim() || null,
        suturas: body.suturas?.trim() || null,
        espadadraspo: body.espadadraspo?.trim() || null,
        jeringas: body.jeringas?.trim() || null,
        bolsaMuestraBiopsia: body.bolsaMuestraBiopsia?.trim() || null,
        manigtas: body.manigtas?.trim() || null,
        lubricante: body.lubricante?.trim() || null,
        otros: body.otros?.trim() || null,
      }
    });

    return NextResponse.json(usedMaterials);

  } catch (error) {
    console.error('Error al actualizar materiales utilizados:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/surgeries/[id]/used-materials - Obtener materiales
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

    const usedMaterials = await prisma.usedMaterials.findUnique({
      where: { surgeryId }
    });

    if (!usedMaterials) {
      return NextResponse.json(
        { error: 'Materiales utilizados no encontrados' },
        { status: 404 }
      );
    }

    return NextResponse.json(usedMaterials);

  } catch (error) {
    console.error('Error al obtener materiales utilizados:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

