import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateExamenFisicoData } from '@/types/hospitalization';

// GET /api/hospitalizations/[id]/examen-fisicos/[examenId] - Obtener examen físico específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; examenId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: hospitalizationId, examenId } = await params;

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

    // Obtener el examen físico específico
    const examenFisico = await prisma.examenFisico.findFirst({
      where: { 
        id: examenId,
        hospitalizationId 
      },
    });

    if (!examenFisico) {
      return NextResponse.json(
        { error: 'Examen físico no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(examenFisico);

  } catch (error) {
    console.error('Error al obtener examen físico:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/hospitalizations/[id]/examen-fisicos/[examenId] - Actualizar examen físico
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; examenId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario tenga permisos para actualizar exámenes físicos
    if (!["admin", "recepcion", "especialista"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: hospitalizationId, examenId } = await params;
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

    // Verificar que el examen físico existe
    const existingExamen = await prisma.examenFisico.findFirst({
      where: { 
        id: examenId,
        hospitalizationId 
      },
    });

    if (!existingExamen) {
      return NextResponse.json(
        { error: 'Examen físico no encontrado' },
        { status: 404 }
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

    // Actualizar el examen físico
    const examenFisico = await prisma.examenFisico.update({
      where: { id: examenId },
      data: {
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

    return NextResponse.json(examenFisico);

  } catch (error) {
    console.error('Error al actualizar examen físico:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/hospitalizations/[id]/examen-fisicos/[examenId] - Eliminar examen físico
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; examenId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario tenga permisos para eliminar exámenes físicos
    if (!["admin", "recepcion", "especialista"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: hospitalizationId, examenId } = await params;

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

    // Verificar que el examen físico existe
    const existingExamen = await prisma.examenFisico.findFirst({
      where: { 
        id: examenId,
        hospitalizationId 
      },
    });

    if (!existingExamen) {
      return NextResponse.json(
        { error: 'Examen físico no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el examen físico
    await prisma.examenFisico.delete({
      where: { id: examenId },
    });

    return NextResponse.json({ message: 'Examen físico eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar examen físico:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
