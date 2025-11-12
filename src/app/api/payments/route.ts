import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CreatePaymentData } from '@/types/payments';
import { TransactionItemWithRelations } from '@/types/api';
import { calculateItemTotal, sumItemTotals, calculatePaymentTotal, calculateDiscount, calculateISV, roundToDecimals } from '@/lib/calculations';

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

    const totalCount = await prisma.payment.count({ 
      where: {
        ...where,
        isActive: true, // Solo pagos activos
      }
    });

    const payments = await prisma.payment.findMany({
      where: {
        ...where,
        isActive: true, // Solo pagos activos
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
            roomId: true,
            admissionDate: true,
          }
        },
        surgery: {
          select: {
            id: true,
            createdAt: true,
            status: true,
          }
        },
        partialPayments: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        refunds: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        invoices: {
          select: {
            id: true
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
          }) as TransactionItemWithRelations[];
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
          }) as TransactionItemWithRelations[];
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
          }) as TransactionItemWithRelations[];
        } else if (payment.surgeryId) {
          items = await prisma.transactionItem.findMany({
            where: {
              sourceType: 'surgery',
              sourceId: payment.surgeryId
            },
            include: {
              serviceItem: { select: { id: true, name: true, type: true, basePrice: true } },
              variant: { select: { id: true, name: true, price: true } }
            }
          }) as TransactionItemWithRelations[];
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
    const { patientId, items, type = 'sale' } = body;

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

    // Validar items antes de crear
    for (const item of items) {
      const isCustom = item.isCustom || false;
      
      if (isCustom) {
        // Item variable: no debe tener priceId
        if (item.priceId) {
          return NextResponse.json({ 
            error: 'Los items variables no pueden tener un serviceItemId asociado' 
          }, { status: 400 });
        }
        // Validar campos requeridos para items variables
        if (!item.nombre || item.nombre.trim() === '') {
          return NextResponse.json({ 
            error: 'Los items variables deben tener una descripción' 
          }, { status: 400 });
        }
        if (!item.precioUnitario || item.precioUnitario <= 0) {
          return NextResponse.json({ 
            error: 'Los items variables deben tener un precio mayor a 0' 
          }, { status: 400 });
        }
        if (!item.quantity || item.quantity <= 0) {
          return NextResponse.json({ 
            error: 'Los items variables deben tener una cantidad mayor a 0' 
          }, { status: 400 });
        }
      } else {
        // Item normal: debe tener priceId
        if (!item.priceId) {
          return NextResponse.json({ 
            error: 'Los items normales deben tener un serviceItemId asociado' 
          }, { status: 400 });
        }
        // Verificar que el serviceItem existe
        const serviceItem = await prisma.serviceItem.findUnique({
          where: { id: item.priceId }
        });
        if (!serviceItem) {
          return NextResponse.json({ 
            error: `ServiceItem con ID ${item.priceId} no encontrado` 
          }, { status: 404 });
        }
      }
    }

    // Crear los TransactionItems
    const createdItems = await Promise.all(
      items.map(async (item) => {
        const isCustom = item.isCustom || false;
        return await prisma.transactionItem.create({
          data: {
            sourceType: 'sale',
            sourceId: sale.id,
            serviceItemId: isCustom ? null : item.priceId!,
            variantId: item.variantId || null,
            quantity: item.quantity,
            isCustom,
            nombre: item.nombre,
            precioUnitario: item.precioUnitario,
            descuento: 0,
            total: calculateItemTotal(item.precioUnitario, item.quantity),
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

    // Calcular total de items (los precios ya incluyen ISV)
    const total = createdItems.reduce((sum, item) => sum + item.total, 0);

    // Crear el pago referenciando la venta (sin descuentos inicialmente)
    // Los precios ya incluyen ISV, por lo que no agregamos ISV adicional
    const newPayment = await prisma.payment.create({
      data: {
        patientId,
        saleId: sale.id,
        total,
        status: 'pendiente',
        discountAmount: 0,
        discountType: null,
        discountValue: null,
        discountReason: null,
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

    // Si es un pago de radiología, crear automáticamente la orden
    let radiologyOrder = null;
    if (type === 'radiology') {
      radiologyOrder = await prisma.radiologyOrder.create({
        data: {
          patientId,
          paymentId: newPayment.id,
          status: 'pending',
          notes: body.notes || '',
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              identityNumber: true,
              birthDate: true,
              gender: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      ...newPayment,
      items: createdItems,
      radiologyOrder, // Incluir la orden si fue creada
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Error al crear el pago' }, { status: 500 });
  }
}

