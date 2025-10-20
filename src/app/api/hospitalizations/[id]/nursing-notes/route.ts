import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateNursingNoteData } from '@/types/hospitalization';

// POST /api/hospitalizations/[id]/nursing-notes - Crear nueva nota de enfermería
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario tenga permisos
    if (!["admin", "recepcion", "especialista"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: hospitalizationId } = await params;
    const body: CreateNursingNoteData = await request.json();

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
        { error: 'Solo se pueden registrar notas en hospitalizaciones activas' },
        { status: 400 }
      );
    }

    // Verificar que el contenido no esté vacío
    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'La nota de enfermería no puede estar vacía' },
        { status: 400 }
      );
    }

    // Crear la nota de enfermería
    const nursingNote = await prisma.nursingNote.create({
      data: {
        hospitalizationId,
        content: body.content.trim(),
      },
    });

    return NextResponse.json(nursingNote, { status: 201 });

  } catch (error) {
    console.error('Error al crear nota de enfermería:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/hospitalizations/[id]/nursing-notes - Obtener notas de enfermería
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

    // Obtener todas las notas de enfermería
    const nursingNotes = await prisma.nursingNote.findMany({
      where: { hospitalizationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(nursingNotes);

  } catch (error) {
    console.error('Error al obtener notas de enfermería:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
