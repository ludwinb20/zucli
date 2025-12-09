import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CreateConsultationData } from '@/types/consultations';
import { TransactionItemWithRelations } from '@/types/transactions';

// GET /api/consultations - Obtener consultas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // Construir filtros
    const where: { patientId?: string, doctorId?: string, status?: string } = {};
    
    if (patientId) {
      where.patientId = patientId;
    }
    
    if (doctorId) {
      where.doctorId = doctorId;
    }
    
    if (status) {
      where.status = status;
    }

    const totalCount = await prisma.consultation.count({ where });

    const consultations = await prisma.consultation.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            username: true,
            specialty: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        consultationDate: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Obtener los items de cada consulta desde TransactionItem
    const consultationsWithItems = await Promise.all(
      consultations.map(async (consultation) => {
        const items = await prisma.transactionItem.findMany({
          where: {
            sourceType: 'consultation',
            sourceId: consultation.id
          },
          include: {
            serviceItem: {
              select: {
                id: true,
                name: true,
                type: true,
                basePrice: true,
              }
            },
            variant: {
              select: {
                id: true,
                name: true,
                price: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        });

        return {
          ...consultation,
          items
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      consultations: consultationsWithItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching consultations:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/consultations - Crear consulta
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: CreateConsultationData = await request.json();
    const { patientId, doctorId, diagnosis, currentIllness, vitalSigns, treatment, items, observations, status } = body;

    // Validar campos requeridos (doctorId puede ser null si la especialidad no tiene doctores)
    if (!patientId) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Crear la consulta
    const newConsultation = await prisma.consultation.create({
      data: {
        patientId,
        doctorId,
        diagnosis: diagnosis || null,
        currentIllness: currentIllness || null,
        vitalSigns: vitalSigns || null,
        treatment: treatment || null,
        observations: observations || null,
        status: status || 'pending',
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            username: true,
            specialty: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    // Crear los TransactionItems si hay items
    let createdItems: TransactionItemWithRelations[] = [];
    if (items && items.length > 0) {
      createdItems = await Promise.all(
        items.map(async (item) => {
          return await prisma.transactionItem.create({
            data: {
              sourceType: 'consultation' as const,
              sourceId: newConsultation.id,
              serviceItemId: item.serviceItemId,
              variantId: item.variantId || null,
              quantity: item.quantity,
              nombre: item.nombre,
              precioUnitario: item.precioUnitario,
              descuento: item.descuento || 0,
              total: item.total,
              addedBy: session.user.id,
            },
            include: {
              serviceItem: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  basePrice: true,
                }
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                }
              }
            }
          });
        })
      ) as TransactionItemWithRelations[];
    }

    // Si hay items, gestionar el pago
    if (createdItems.length > 0) {
      try {
        // Calcular el total de los items
        const totalItems = createdItems.reduce((sum, item) => sum + item.total, 0);
        
        // Buscar un pago pendiente existente para esta consulta
        let payment = await prisma.payment.findFirst({
          where: {
            consultationId: newConsultation.id,
            status: 'pendiente'
          }
        });

        if (!payment) {
          // Crear un nuevo pago referenciando la consulta
          payment = await prisma.payment.create({
            data: {
              patientId,
              consultationId: newConsultation.id,
              status: 'pendiente',
              total: totalItems,
              createdBy: session.user.id,
            }
          });
        }
      } catch (paymentError) {
        console.error('Error al gestionar el pago:', paymentError);
        // No fallar la consulta si hay error en el pago
      }
    }

    // Retornar la consulta con sus items
    return NextResponse.json({
      ...newConsultation,
      items: createdItems
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating consultation:', error);
    return NextResponse.json({ error: 'Error al crear la consulta' }, { status: 500 });
  }
}
