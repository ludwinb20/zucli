import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateOperativeNoteData } from '@/types/surgery';

// POST /api/surgeries/[id]/operative-note - Crear nota operatoria
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
    const body: CreateOperativeNoteData = await request.json();

    // Verificar que la cirugía existe
    const surgery = await prisma.surgery.findUnique({
      where: { id: surgeryId },
      select: { id: true, status: true }
    });

    if (!surgery) {
      return NextResponse.json(
        { error: 'Cirugía no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que no exista ya una nota operatoria
    const existing = await prisma.operativeNote.findUnique({
      where: { surgeryId }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una nota operatoria para esta cirugía' },
        { status: 400 }
      );
    }

    // Validar que al menos el diagnóstico preoperatorio esté presente
    if (!body.diagnosticoPreoperatorio?.trim()) {
      return NextResponse.json(
        { error: 'El diagnóstico preoperatorio es requerido' },
        { status: 400 }
      );
    }

    // Crear la nota operatoria
    const operativeNote = await prisma.operativeNote.create({
      data: {
        surgeryId,
        diagnosticoPreoperatorio: body.diagnosticoPreoperatorio.trim(),
        ayudante: body.ayudante?.trim() || null,
        anestesia: body.anestesia?.trim() || null,
        circulante: body.circulante?.trim() || null,
        instrumentalista: body.instrumentalista?.trim() || null,
        sangrado: body.sangrado?.trim() || null,
        complicaciones: body.complicaciones?.trim() || null,
        conteoMaterial: body.conteoMaterial?.trim() || null,
        hallazgos: body.hallazgos?.trim() || null,
      }
    });

    return NextResponse.json(operativeNote, { status: 201 });

  } catch (error) {
    console.error('Error al crear nota operatoria:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/surgeries/[id]/operative-note - Actualizar nota operatoria
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
    const body: CreateOperativeNoteData = await request.json();

    // Verificar que la nota existe
    const existing = await prisma.operativeNote.findUnique({
      where: { surgeryId }
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Nota operatoria no encontrada' },
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

    // Actualizar la nota operatoria
    const operativeNote = await prisma.operativeNote.update({
      where: { surgeryId },
      data: {
        diagnosticoPreoperatorio: body.diagnosticoPreoperatorio.trim(),
        ayudante: body.ayudante?.trim() || null,
        anestesia: body.anestesia?.trim() || null,
        circulante: body.circulante?.trim() || null,
        instrumentalista: body.instrumentalista?.trim() || null,
        sangrado: body.sangrado?.trim() || null,
        complicaciones: body.complicaciones?.trim() || null,
        conteoMaterial: body.conteoMaterial?.trim() || null,
        hallazgos: body.hallazgos?.trim() || null,
      }
    });

    return NextResponse.json(operativeNote);

  } catch (error) {
    console.error('Error al actualizar nota operatoria:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/surgeries/[id]/operative-note - Obtener nota operatoria
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

    const operativeNote = await prisma.operativeNote.findUnique({
      where: { surgeryId }
    });

    if (!operativeNote) {
      return NextResponse.json(
        { error: 'Nota operatoria no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(operativeNote);

  } catch (error) {
    console.error('Error al obtener nota operatoria:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

