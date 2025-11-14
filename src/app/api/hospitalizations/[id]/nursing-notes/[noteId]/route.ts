import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateNursingNoteData } from '@/types/hospitalization';

// GET /api/hospitalizations/[id]/nursing-notes/[noteId] - Obtener nota específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: hospitalizationId, noteId } = await params;

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

    // Obtener la nota específica
    const nursingNote = await prisma.nursingNote.findFirst({
      where: { 
        id: noteId,
        hospitalizationId 
      },
    });

    if (!nursingNote) {
      return NextResponse.json(
        { error: 'Nota de enfermería no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(nursingNote);

  } catch (error) {
    console.error('Error al obtener nota de enfermería:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/hospitalizations/[id]/nursing-notes/[noteId] - Actualizar nota
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos
    if (!["admin", "recepcion", "especialista", "medico_sala"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: hospitalizationId, noteId } = await params;
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

    // Verificar que la nota existe
    const existingNote = await prisma.nursingNote.findFirst({
      where: { 
        id: noteId,
        hospitalizationId 
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Nota de enfermería no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el contenido no esté vacío
    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'La nota de enfermería no puede estar vacía' },
        { status: 400 }
      );
    }

    // Actualizar la nota
    const nursingNote = await prisma.nursingNote.update({
      where: { id: noteId },
      data: {
        content: body.content.trim(),
      },
    });

    return NextResponse.json(nursingNote);

  } catch (error) {
    console.error('Error al actualizar nota de enfermería:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/hospitalizations/[id]/nursing-notes/[noteId] - Eliminar nota
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos
    if (!["admin", "recepcion", "especialista", "medico_sala"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: hospitalizationId, noteId } = await params;

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

    // Verificar que la nota existe
    const existingNote = await prisma.nursingNote.findFirst({
      where: { 
        id: noteId,
        hospitalizationId 
      },
    });

    if (!existingNote) {
      return NextResponse.json(
        { error: 'Nota de enfermería no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar la nota
    await prisma.nursingNote.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ message: 'Nota de enfermería eliminada correctamente' });

  } catch (error) {
    console.error('Error al eliminar nota de enfermería:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
