import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateOperatingRoomRequestData } from '@/types/surgery';

// POST /api/surgeries/[id]/operating-room-request - Crear solicitud de quirófano
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!["admin", "especialista"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: surgeryId } = await params;
    const body: CreateOperatingRoomRequestData = await request.json();

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
    const existing = await prisma.operatingRoomRequest.findUnique({
      where: { surgeryId }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una solicitud de quirófano para esta cirugía' },
        { status: 400 }
      );
    }

    // Validar diagnóstico preoperatorio
    if (!body.diagnosticoPreoperatorio?.trim()) {
      return NextResponse.json(
        { error: 'El diagnóstico preoperatorio es requerido' },
        { status: 400 }
      );
    }

    // Crear la solicitud
    const operatingRoomRequest = await prisma.operatingRoomRequest.create({
      data: {
        surgeryId,
        diagnosticoPreoperatorio: body.diagnosticoPreoperatorio.trim(),
        tipoAnestesia: body.tipoAnestesia?.trim() || null,
        instrumentoEspecial: body.instrumentoEspecial?.trim() || null,
        horaSolicitud: body.horaSolicitud ? new Date(body.horaSolicitud) : null,
        horaLlegadaQx: body.horaLlegadaQx ? new Date(body.horaLlegadaQx) : null,
        horaEntraQx: body.horaEntraQx ? new Date(body.horaEntraQx) : null,
        horaAnestesia: body.horaAnestesia ? new Date(body.horaAnestesia) : null,
        horaInicioQx: body.horaInicioQx ? new Date(body.horaInicioQx) : null,
        horaFinQx: body.horaFinQx ? new Date(body.horaFinQx) : null,
        horaSaleQx: body.horaSaleQx ? new Date(body.horaSaleQx) : null,
        horaRecibeRecuperacion: body.horaRecibeRecuperacion ? new Date(body.horaRecibeRecuperacion) : null,
        horaSaleRecuperacion: body.horaSaleRecuperacion ? new Date(body.horaSaleRecuperacion) : null,
        usoSangre: body.usoSangre || false,
        entregaOportunaSangre: body.entregaOportunaSangre || false,
        complicacion: body.complicacion || false,
        tipoComplicacion: body.tipoComplicacion?.trim() || null,
        contaminacionQuirofano: body.contaminacionQuirofano || false,
        fumigaQuirofanoPor: body.fumigaQuirofanoPor?.trim() || null,
        tiempo: body.tiempo?.trim() || null,
        medicoSolicitante: body.medicoSolicitante?.trim() || null,
        anestesiologoAnestesista: body.anestesiologoAnestesista?.trim() || null,
        instrumentista: body.instrumentista?.trim() || null,
        circulante: body.circulante?.trim() || null,
        ayudantes: body.ayudantes?.trim() || null,
        observaciones: body.observaciones?.trim() || null,
      }
    });

    return NextResponse.json(operatingRoomRequest, { status: 201 });

  } catch (error) {
    console.error('Error al crear solicitud de quirófano:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/surgeries/[id]/operating-room-request - Actualizar solicitud
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!["admin", "especialista"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: surgeryId } = await params;
    const body: CreateOperatingRoomRequestData = await request.json();

    // Verificar que existe
    const existing = await prisma.operatingRoomRequest.findUnique({
      where: { surgeryId }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Solicitud de quirófano no encontrada' },
        { status: 404 }
      );
    }

    // Validar diagnóstico
    if (!body.diagnosticoPreoperatorio?.trim()) {
      return NextResponse.json(
        { error: 'El diagnóstico preoperatorio es requerido' },
        { status: 400 }
      );
    }

    // Actualizar
    const operatingRoomRequest = await prisma.operatingRoomRequest.update({
      where: { surgeryId },
      data: {
        diagnosticoPreoperatorio: body.diagnosticoPreoperatorio.trim(),
        tipoAnestesia: body.tipoAnestesia?.trim() || null,
        instrumentoEspecial: body.instrumentoEspecial?.trim() || null,
        horaSolicitud: body.horaSolicitud ? new Date(body.horaSolicitud) : null,
        horaLlegadaQx: body.horaLlegadaQx ? new Date(body.horaLlegadaQx) : null,
        horaEntraQx: body.horaEntraQx ? new Date(body.horaEntraQx) : null,
        horaAnestesia: body.horaAnestesia ? new Date(body.horaAnestesia) : null,
        horaInicioQx: body.horaInicioQx ? new Date(body.horaInicioQx) : null,
        horaFinQx: body.horaFinQx ? new Date(body.horaFinQx) : null,
        horaSaleQx: body.horaSaleQx ? new Date(body.horaSaleQx) : null,
        horaRecibeRecuperacion: body.horaRecibeRecuperacion ? new Date(body.horaRecibeRecuperacion) : null,
        horaSaleRecuperacion: body.horaSaleRecuperacion ? new Date(body.horaSaleRecuperacion) : null,
        usoSangre: body.usoSangre || false,
        entregaOportunaSangre: body.entregaOportunaSangre || false,
        complicacion: body.complicacion || false,
        tipoComplicacion: body.tipoComplicacion?.trim() || null,
        contaminacionQuirofano: body.contaminacionQuirofano || false,
        fumigaQuirofanoPor: body.fumigaQuirofanoPor?.trim() || null,
        tiempo: body.tiempo?.trim() || null,
        medicoSolicitante: body.medicoSolicitante?.trim() || null,
        anestesiologoAnestesista: body.anestesiologoAnestesista?.trim() || null,
        instrumentista: body.instrumentista?.trim() || null,
        circulante: body.circulante?.trim() || null,
        ayudantes: body.ayudantes?.trim() || null,
        observaciones: body.observaciones?.trim() || null,
      }
    });

    return NextResponse.json(operatingRoomRequest);

  } catch (error) {
    console.error('Error al actualizar solicitud de quirófano:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/surgeries/[id]/operating-room-request - Obtener solicitud
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

    const operatingRoomRequest = await prisma.operatingRoomRequest.findUnique({
      where: { surgeryId }
    });

    if (!operatingRoomRequest) {
      return NextResponse.json(
        { error: 'Solicitud de quirófano no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(operatingRoomRequest);

  } catch (error) {
    console.error('Error al obtener solicitud de quirófano:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

