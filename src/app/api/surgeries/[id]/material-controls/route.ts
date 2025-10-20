import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateMaterialControlData } from '@/types/surgery';

// POST /api/surgeries/[id]/material-controls - Crear control de materiales
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
    const body: CreateMaterialControlData = await request.json();

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

    // Validar momento
    if (!body.moment || !['pre', 'trans', 'final'].includes(body.moment)) {
      return NextResponse.json(
        { error: 'Momento inválido. Debe ser: pre, trans o final' },
        { status: 400 }
      );
    }

    // Verificar que no exista ya un registro para este momento
    const existing = await prisma.materialControl.findFirst({
      where: {
        surgeryId,
        moment: body.moment
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: `Ya existe un control de materiales para el momento: ${body.moment}` },
        { status: 400 }
      );
    }

    // Crear el control de materiales
    const materialControl = await prisma.materialControl.create({
      data: {
        surgeryId,
        moment: body.moment,
        tijerasMetzembaumCurvas: body.tijerasMetzembaumCurvas || 0,
        tijerasMetzembaumRectas: body.tijerasMetzembaumRectas || 0,
        tijeraMayoCurvas: body.tijeraMayoCurvas || 0,
        tijeraMayoRectas: body.tijeraMayoRectas || 0,
        mangoBisturi: body.mangoBisturi || 0,
        hemostaticaCurvas: body.hemostaticaCurvas || 0,
        hemostaticaRectas: body.hemostaticaRectas || 0,
        pinzaKellyCurvas: body.pinzaKellyCurvas || 0,
        pinzaKellyRectas: body.pinzaKellyRectas || 0,
        pinzaKochersCurvas: body.pinzaKochersCurvas || 0,
        pinzaKorchersRectas: body.pinzaKorchersRectas || 0,
        pinzaMosquitoCurvas: body.pinzaMosquitoCurvas || 0,
        pinzaMosquitoRectas: body.pinzaMosquitoRectas || 0,
        pinzaAllis: body.pinzaAllis || 0,
        pinzaBabcock: body.pinzaBabcock || 0,
        pinzaCampo: body.pinzaCampo || 0,
        pinzaDiseccionSinDientes: body.pinzaDiseccionSinDientes || 0,
        pinzaDiseccionConDientes: body.pinzaDiseccionConDientes || 0,
        pinzaAnillo: body.pinzaAnillo || 0,
        pinzaGinecologicas: body.pinzaGinecologicas || 0,
        pinzaMixter: body.pinzaMixter || 0,
        portagujas: body.portagujas || 0,
        separadores: body.separadores || 0,
        pinzaPeam: body.pinzaPeam || 0,
        otrosSeparadores: body.otrosSeparadores || 0,
        otrasPinzas: body.otrasPinzas || 0,
        otros: body.otros || 0,
        cromico: body.cromico || 0,
        sedas: body.sedas || 0,
        nylon: body.nylon || 0,
        poliglactinaVicryl: body.poliglactinaVicryl || 0,
        otrasSuturas: body.otrasSuturas || 0,
        otrosSuturas: body.otrosSuturas || 0,
      }
    });

    return NextResponse.json(materialControl, { status: 201 });

  } catch (error) {
    console.error('Error al crear control de materiales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/surgeries/[id]/material-controls - Listar controles de materiales
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
    const { searchParams } = new URL(request.url);
    const moment = searchParams.get('moment');

    // Si se especifica un momento, filtrar por él
    const where: {
      surgeryId: string;
      moment?: string;
    } = { surgeryId };
    if (moment && ['pre', 'trans', 'final'].includes(moment)) {
      where.moment = moment;
    }

    const materialControls = await prisma.materialControl.findMany({
      where,
      orderBy: { createdAt: 'asc' }
    });

    // Si se busca un momento específico, devolver solo ese registro
    if (moment) {
      return NextResponse.json(materialControls[0] || null);
    }

    return NextResponse.json(materialControls);

  } catch (error) {
    console.error('Error al obtener controles de materiales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/surgeries/[id]/material-controls - Actualizar control de materiales
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
    const body: CreateMaterialControlData = await request.json();

    // Validar momento
    if (!body.moment || !['pre', 'trans', 'final'].includes(body.moment)) {
      return NextResponse.json(
        { error: 'Momento inválido. Debe ser: pre, trans o final' },
        { status: 400 }
      );
    }

    // Buscar el registro existente
    const existing = await prisma.materialControl.findFirst({
      where: {
        surgeryId,
        moment: body.moment
      }
    });

    if (!existing) {
      return NextResponse.json(
        { error: `No existe un control de materiales para el momento: ${body.moment}` },
        { status: 404 }
      );
    }

    // Actualizar el control de materiales
    const materialControl = await prisma.materialControl.update({
      where: { id: existing.id },
      data: {
        tijerasMetzembaumCurvas: body.tijerasMetzembaumCurvas || 0,
        tijerasMetzembaumRectas: body.tijerasMetzembaumRectas || 0,
        tijeraMayoCurvas: body.tijeraMayoCurvas || 0,
        tijeraMayoRectas: body.tijeraMayoRectas || 0,
        mangoBisturi: body.mangoBisturi || 0,
        hemostaticaCurvas: body.hemostaticaCurvas || 0,
        hemostaticaRectas: body.hemostaticaRectas || 0,
        pinzaKellyCurvas: body.pinzaKellyCurvas || 0,
        pinzaKellyRectas: body.pinzaKellyRectas || 0,
        pinzaKochersCurvas: body.pinzaKochersCurvas || 0,
        pinzaKorchersRectas: body.pinzaKorchersRectas || 0,
        pinzaMosquitoCurvas: body.pinzaMosquitoCurvas || 0,
        pinzaMosquitoRectas: body.pinzaMosquitoRectas || 0,
        pinzaAllis: body.pinzaAllis || 0,
        pinzaBabcock: body.pinzaBabcock || 0,
        pinzaCampo: body.pinzaCampo || 0,
        pinzaDiseccionSinDientes: body.pinzaDiseccionSinDientes || 0,
        pinzaDiseccionConDientes: body.pinzaDiseccionConDientes || 0,
        pinzaAnillo: body.pinzaAnillo || 0,
        pinzaGinecologicas: body.pinzaGinecologicas || 0,
        pinzaMixter: body.pinzaMixter || 0,
        portagujas: body.portagujas || 0,
        separadores: body.separadores || 0,
        pinzaPeam: body.pinzaPeam || 0,
        otrosSeparadores: body.otrosSeparadores || 0,
        otrasPinzas: body.otrasPinzas || 0,
        otros: body.otros || 0,
        cromico: body.cromico || 0,
        sedas: body.sedas || 0,
        nylon: body.nylon || 0,
        poliglactinaVicryl: body.poliglactinaVicryl || 0,
        otrasSuturas: body.otrasSuturas || 0,
        otrosSuturas: body.otrosSuturas || 0,
      }
    });

    return NextResponse.json(materialControl);

  } catch (error) {
    console.error('Error al actualizar control de materiales:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

