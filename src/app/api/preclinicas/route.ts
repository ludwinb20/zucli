import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Crear nueva preclínica
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      appointmentId,
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

    // Validar que la cita existe
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Cita no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que no existe ya una preclínica para esta cita
    const existingPreclinica = await prisma.preclinica.findUnique({
      where: { appointmentId }
    });

    if (existingPreclinica) {
      return NextResponse.json(
        { error: 'Ya existe una preclínica para esta cita' },
        { status: 400 }
      );
    }

    // Crear la preclínica
    const preclinica = await prisma.preclinica.create({
      data: {
        appointmentId,
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
        }
      }
    });

    // Actualizar el estado de la cita a "pendiente"
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: 'pendiente' }
    });

    return NextResponse.json(preclinica, { status: 201 });

  } catch (error) {
    console.error('Error creating preclinica:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Obtener preclínicas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointmentId');

    if (appointmentId) {
      // Obtener preclínica específica
      const preclinica = await prisma.preclinica.findUnique({
        where: { appointmentId },
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
    }

    // Obtener todas las preclínicas
    const preclinicas = await prisma.preclinica.findMany({
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(preclinicas);

  } catch (error) {
    console.error('Error fetching preclinicas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
