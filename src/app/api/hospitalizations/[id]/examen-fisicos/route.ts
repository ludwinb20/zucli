import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateExamenFisicoData } from '@/types/hospitalization';

// POST /api/hospitalizations/[id]/examen-fisicos - Crear nuevo examen físico
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario tenga permisos para registrar exámenes físicos
    if (!["admin", "recepcion", "especialista"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: hospitalizationId } = await params;
    const body: CreateExamenFisicoData = await request.json();

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
        { error: 'Solo se pueden registrar exámenes físicos en hospitalizaciones activas' },
        { status: 400 }
      );
    }

    // Verificar que al menos un campo tenga contenido
    const hasContent = Object.values(body).some(value => value && value.trim() !== "");
    
    if (!hasContent) {
      return NextResponse.json(
        { error: 'Debe completar al menos un campo del examen físico' },
        { status: 400 }
      );
    }

    // Crear el examen físico
    const examenFisico = await prisma.examenFisico.create({
      data: {
        hospitalizationId,
        aparienciaGeneral: body.aparienciaGeneral || null,
        cabeza: body.cabeza || null,
        ojos: body.ojos || null,
        orl: body.orl || null,
        torax: body.torax || null,
        corazon: body.corazon || null,
        pulmones: body.pulmones || null,
        abdomen: body.abdomen || null,
        genitoUrinario: body.genitoUrinario || null,
        extremidades: body.extremidades || null,
        osteoarticular: body.osteoarticular || null,
        pielYPaneras: body.pielYPaneras || null,
        neurologicos: body.neurologicos || null,
        columna: body.columna || null,
        comentarios: body.comentarios || null,
        diagnostico: body.diagnostico || null,
      },
    });

    return NextResponse.json(examenFisico, { status: 201 });

  } catch (error) {
    console.error('Error al crear examen físico:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/hospitalizations/[id]/examen-fisicos - Obtener exámenes físicos de una hospitalización
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

    // Obtener todos los exámenes físicos de la hospitalización
    const examenFisicos = await prisma.examenFisico.findMany({
      where: { hospitalizationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(examenFisicos);

  } catch (error) {
    console.error('Error al obtener exámenes físicos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
