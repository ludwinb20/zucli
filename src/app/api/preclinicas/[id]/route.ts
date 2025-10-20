import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener preclínica por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const preclinica = await prisma.preclinica.findUnique({
      where: { id },
      include: {
        appointment: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                identityNumber: true
              }
            },
            specialty: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        hospitalization: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                identityNumber: true
              }
            }
          }
        }
      }
    });

    if (!preclinica) {
      return NextResponse.json(
        { error: 'Preclínica no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(preclinica);

  } catch (error) {
    console.error('Error fetching preclinica:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar preclínica
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
      tx
    } = body;

    const preclinica = await prisma.preclinica.update({
      where: { id },
      data: {
        presionArterial: presionArterial?.trim() || null,
        temperatura: temperatura ? parseFloat(temperatura) : null,
        fc: fc ? parseInt(fc) : null,
        fr: fr ? parseInt(fr) : null,
        satO2: satO2 ? parseInt(satO2) : null,
        peso: peso ? parseFloat(peso) : null,
        talla: talla ? parseFloat(talla) : null,
        examenFisico: examenFisico?.trim() || null,
        idc: idc?.trim() || null,
        tx: tx?.trim() || null
      },
      include: {
        appointment: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                identityNumber: true
              }
            },
            specialty: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        hospitalization: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                identityNumber: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(preclinica);

  } catch (error) {
    console.error('Error updating preclinica:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar preclínica
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.preclinica.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Preclínica eliminada exitosamente' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting preclinica:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
