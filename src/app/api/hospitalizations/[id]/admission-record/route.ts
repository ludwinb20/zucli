import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateAdmissionRecordData } from '@/types/hospitalization';

// POST /api/hospitalizations/[id]/admission-record - Crear registro de admisión
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
    if (!["admin", "recepcion", "especialista", "medico_sala"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: hospitalizationId } = await params;
    const body: CreateAdmissionRecordData = await request.json();

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
        { error: 'Solo se pueden registrar admisiones en hospitalizaciones activas' },
        { status: 400 }
      );
    }

    // Verificar que no exista ya un registro de admisión
    const existingRecord = await prisma.admissionRecord.findUnique({
      where: { hospitalizationId }
    });

    if (existingRecord) {
      return NextResponse.json(
        { error: 'Ya existe un registro de admisión para esta hospitalización' },
        { status: 400 }
      );
    }

    // Validar que al menos un campo tenga contenido
    const hasContent = 
      body.hea?.trim() ||
      body.fog?.trim() ||
      body.antecedentesPatologicos?.trim() ||
      body.antecedentesInmunoAlergicos?.trim() ||
      body.antecedentesGO?.trim() ||
      body.antecedentesTraumaticosQuirurgicos?.trim() ||
      body.antecedentesFamiliares?.trim() ||
      body.dieta?.trim() ||
      body.signosVitalesHoras ||
      body.semifowler ||
      body.fowler ||
      body.liquidosIV?.trim() ||
      body.medicamentos?.trim() ||
      body.examenesLaboratorio?.trim() ||
      body.glocometria?.trim() ||
      body.anotaciones.length > 0 ||
      body.ordenes.length > 0;

    if (!hasContent) {
      return NextResponse.json(
        { error: 'Al menos un campo debe tener contenido' },
        { status: 400 }
      );
    }

    // Crear el registro de admisión con anotaciones y órdenes
    const admissionRecord = await prisma.admissionRecord.create({
      data: {
        hospitalizationId,
        // Historia Clínica
        hea: body.hea?.trim() || null,
        fog: body.fog?.trim() || null,
        antecedentesPatologicos: body.antecedentesPatologicos?.trim() || null,
        antecedentesInmunoAlergicos: body.antecedentesInmunoAlergicos?.trim() || null,
        antecedentesGO: body.antecedentesGO?.trim() || null,
        antecedentesTraumaticosQuirurgicos: body.antecedentesTraumaticosQuirurgicos?.trim() || null,
        antecedentesFamiliares: body.antecedentesFamiliares?.trim() || null,
        // Órdenes y Anotaciones Médicas
        dieta: body.dieta?.trim() || null,
        signosVitalesHoras: body.signosVitalesHoras || null,
        semifowler: body.semifowler,
        fowler: body.fowler,
        liquidosIV: body.liquidosIV?.trim() || null,
        medicamentos: body.medicamentos?.trim() || null,
        examenesLaboratorio: body.examenesLaboratorio?.trim() || null,
        glocometria: body.glocometria?.trim() || null,
        // Anotaciones y Órdenes
        anotaciones: {
          create: body.anotaciones.map(content => ({
            content: content.trim()
          }))
        },
        ordenes: {
          create: body.ordenes.map(content => ({
            content: content.trim()
          }))
        }
      },
      include: {
        anotaciones: true,
        ordenes: true,
      },
    });

    return NextResponse.json(admissionRecord, { status: 201 });

  } catch (error) {
    console.error('Error al crear registro de admisión:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/hospitalizations/[id]/admission-record - Obtener registro de admisión
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

    // Obtener el registro de admisión
    const admissionRecord = await prisma.admissionRecord.findUnique({
      where: { hospitalizationId },
      include: {
        anotaciones: {
          orderBy: { createdAt: 'asc' }
        },
        ordenes: {
          orderBy: { createdAt: 'asc' }
        },
      },
    });

    if (!admissionRecord) {
      return NextResponse.json(
        { error: 'Registro de admisión no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(admissionRecord);

  } catch (error) {
    console.error('Error al obtener registro de admisión:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/hospitalizations/[id]/admission-record - Actualizar registro de admisión
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: hospitalizationId } = await params;
    const body: CreateAdmissionRecordData = await request.json();

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

    // Verificar que el registro existe
    const existingRecord = await prisma.admissionRecord.findUnique({
      where: { hospitalizationId }
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Registro de admisión no encontrado' },
        { status: 404 }
      );
    }

    // Validar que al menos un campo tenga contenido
    const hasContent = 
      body.hea?.trim() ||
      body.fog?.trim() ||
      body.antecedentesPatologicos?.trim() ||
      body.antecedentesInmunoAlergicos?.trim() ||
      body.antecedentesGO?.trim() ||
      body.antecedentesTraumaticosQuirurgicos?.trim() ||
      body.antecedentesFamiliares?.trim() ||
      body.dieta?.trim() ||
      body.signosVitalesHoras ||
      body.semifowler ||
      body.fowler ||
      body.liquidosIV?.trim() ||
      body.medicamentos?.trim() ||
      body.examenesLaboratorio?.trim() ||
      body.glocometria?.trim() ||
      body.anotaciones.length > 0 ||
      body.ordenes.length > 0;

    if (!hasContent) {
      return NextResponse.json(
        { error: 'Al menos un campo debe tener contenido' },
        { status: 400 }
      );
    }

    // Actualizar el registro de admisión
    const admissionRecord = await prisma.admissionRecord.update({
      where: { id: existingRecord.id },
      data: {
        // Historia Clínica
        hea: body.hea?.trim() || null,
        fog: body.fog?.trim() || null,
        antecedentesPatologicos: body.antecedentesPatologicos?.trim() || null,
        antecedentesInmunoAlergicos: body.antecedentesInmunoAlergicos?.trim() || null,
        antecedentesGO: body.antecedentesGO?.trim() || null,
        antecedentesTraumaticosQuirurgicos: body.antecedentesTraumaticosQuirurgicos?.trim() || null,
        antecedentesFamiliares: body.antecedentesFamiliares?.trim() || null,
        // Órdenes y Anotaciones Médicas
        dieta: body.dieta?.trim() || null,
        signosVitalesHoras: body.signosVitalesHoras || null,
        semifowler: body.semifowler,
        fowler: body.fowler,
        liquidosIV: body.liquidosIV?.trim() || null,
        medicamentos: body.medicamentos?.trim() || null,
        examenesLaboratorio: body.examenesLaboratorio?.trim() || null,
        glocometria: body.glocometria?.trim() || null,
      },
      include: {
        anotaciones: true,
        ordenes: true,
      },
    });

    // Eliminar anotaciones y órdenes existentes
    await prisma.admissionAnnotation.deleteMany({
      where: { admissionRecordId: existingRecord.id }
    });
    await prisma.admissionOrder.deleteMany({
      where: { admissionRecordId: existingRecord.id }
    });

    // Crear nuevas anotaciones y órdenes
    if (body.anotaciones.length > 0) {
      await prisma.admissionAnnotation.createMany({
        data: body.anotaciones.map(content => ({
          admissionRecordId: existingRecord.id,
          content: content.trim()
        }))
      });
    }

    if (body.ordenes.length > 0) {
      await prisma.admissionOrder.createMany({
        data: body.ordenes.map(content => ({
          admissionRecordId: existingRecord.id,
          content: content.trim()
        }))
      });
    }

    // Obtener el registro actualizado
    const updatedRecord = await prisma.admissionRecord.findUnique({
      where: { id: existingRecord.id },
      include: {
        anotaciones: {
          orderBy: { createdAt: 'asc' }
        },
        ordenes: {
          orderBy: { createdAt: 'asc' }
        },
      },
    });

    return NextResponse.json(updatedRecord);

  } catch (error) {
    console.error('Error al actualizar registro de admisión:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
