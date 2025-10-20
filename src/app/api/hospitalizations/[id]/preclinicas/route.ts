import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/hospitalizations/[id]/preclinicas - Listar preclínicas de una hospitalización
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que la hospitalización existe
    const hospitalization = await prisma.hospitalization.findUnique({
      where: { id },
    });

    if (!hospitalization) {
      return NextResponse.json(
        { error: 'Hospitalización no encontrada' },
        { status: 404 }
      );
    }

    // Obtener preclínicas
    const preclinicas = await prisma.preclinica.findMany({
      where: {
        hospitalizationId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(preclinicas);
  } catch (error) {
    console.error('Error al obtener preclínicas:', error);
    return NextResponse.json(
      { error: 'Error al obtener preclínicas' },
      { status: 500 }
    );
  }
}

// POST /api/hospitalizations/[id]/preclinicas - Crear preclínica para hospitalización
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      presionArterial,
      temperatura,
      fc,
      fr,
      satO2,
      peso,
      talla,
      examenFisico,
      idc,
      tx,
    } = body;

    // Verificar que la hospitalización existe y está activa
    const hospitalization = await prisma.hospitalization.findUnique({
      where: { id },
    });

    if (!hospitalization) {
      return NextResponse.json(
        { error: 'Hospitalización no encontrada' },
        { status: 404 }
      );
    }

    if (hospitalization.status !== 'iniciada') {
      return NextResponse.json(
        { error: 'Solo se pueden registrar preclínicas en hospitalizaciones activas' },
        { status: 400 }
      );
    }

    // Crear preclínica (convertir tipos)
    const preclinica = await prisma.preclinica.create({
      data: {
        hospitalizationId: id,
        presionArterial: presionArterial?.trim() || null,
        temperatura: temperatura ? parseFloat(temperatura) : null,
        fc: fc ? parseInt(fc) : null,
        fr: fr ? parseInt(fr) : null,
        satO2: satO2 ? parseInt(satO2) : null,
        peso: peso ? parseFloat(peso) : null,
        talla: talla ? parseFloat(talla) : null,
        examenFisico: examenFisico?.trim() || null,
        idc: idc?.trim() || null,
        tx: tx?.trim() || null,
      },
    });

    return NextResponse.json(preclinica, { status: 201 });
  } catch (error) {
    console.error('Error al crear preclínica:', error);
    return NextResponse.json(
      { error: 'Error al crear preclínica' },
      { status: 500 }
    );
  }
}

