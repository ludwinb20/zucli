import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CreatePaymentData } from '@/types/payments';
import { TransactionItemWithRelations } from '@/types/api';

// GET /api/payments - Obtener pagos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // Construir filtros
    const where: { patientId?: string, status?: string, patient?: { OR?: Array<{ firstName?: { contains: string }, lastName?: { contains: string }, identityNumber?: { contains: string } }> } } = {};
    
    if (patientId) {
      where.patientId = patientId;
    }
    
    if (status) {
      where.status = status;
    }

    // Búsqueda por nombre o identidad del paciente
    if (search) {
      where.patient = {
        OR: [
          {
            firstName: {
              contains: search,
            }
          },
          {
            lastName: {
              contains: search,
            }
          },
          {
            identityNumber: {
              contains: search,
            }
          }
        ]
      };
    }

    const totalCount = await prisma.payment.count({ where });

    const payments = await prisma.payment.findMany({
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
        consultation: {
          select: {
            id: true,
            doctorId: true,
            consultationDate: true,
          }
        },
        sale: {
          select: {
            id: true,
            type: true,
            createdAt: true,
          }
        },
        hospitalization: {
          select: {
            id: true,
            roomNumber: true,
            admissionDate: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Obtener los items de cada pago desde TransactionItem
    const paymentsWithItems = await Promise.all(
      payments.map(async (payment) => {
        let items: TransactionItemWithRelations[] = [];
        
        // Determinar la fuente y obtener items
        if (payment.consultationId) {
          items = await prisma.transactionItem.findMany({
            where: {
              sourceType: 'consultation',
              sourceId: payment.consultationId
            },
            include: {
              serviceItem: { select: { id: true, name: true, type: true, basePrice: true } },
              variant: { select: { id: true, name: true, price: true } }
            }
          });
        } else if (payment.saleId) {
          items = await prisma.transactionItem.findMany({
            where: {
              sourceType: 'sale',
              sourceId: payment.saleId
            },
            include: {
              serviceItem: { select: { id: true, name: true, type: true, basePrice: true } },
              variant: { select: { id: true, name: true, price: true } }
            }
          });
        } else if (payment.hospitalizationId) {
          items = await prisma.transactionItem.findMany({
            where: {
              sourceType: 'hospitalization',
              sourceId: payment.hospitalizationId
            },
            include: {
              serviceItem: { select: { id: true, name: true, type: true, basePrice: true } },
              variant: { select: { id: true, name: true, price: true } }
            }
          });
        }

        return {
          ...payment,
          items
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      payments: paymentsWithItems,
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
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/payments - Crear pago directo (crea una venta automática)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: CreatePaymentData = await request.json();
    const { patientId, items } = body;

    // Validar campos requeridos
    if (!patientId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Crear una venta directa automáticamente
    const sale = await prisma.sale.create({
      data: {
        patientId,
        cashierId: session.user.id,
        type: 'direct_payment',
        notes: 'Pago directo desde sistema',
      }
    });

    // Crear los TransactionItems
    const createdItems = await Promise.all(
      items.map(async (item) => {
        return await prisma.transactionItem.create({
          data: {
            sourceType: 'sale',
            sourceId: sale.id,
            serviceItemId: item.priceId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            nombre: item.nombre,
            precioUnitario: item.precioUnitario,
            descuento: 0,
            total: item.precioUnitario * item.quantity,
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
    );

    // Calcular total
    const total = createdItems.reduce((sum, item) => sum + item.total, 0);

    // Crear el pago referenciando la venta
    const newPayment = await prisma.payment.create({
      data: {
        patientId,
        saleId: sale.id,
        total,
        status: 'pendiente',
        createdBy: session.user.id,
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
        sale: {
          select: {
            id: true,
            type: true,
            createdAt: true,
          }
        }
      }
    });

    return NextResponse.json({
      ...newPayment,
      items: createdItems
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Error al crear el pago' }, { status: 500 });
  }
}

