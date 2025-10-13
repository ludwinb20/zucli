import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// import { PrismaSalesWhereFilter } from '@/types/api';
import { CreateSaleData } from '@/types/transactions';

// GET /api/sales - Obtener ventas directas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const cashierId = searchParams.get('cashierId');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // Construir filtros
    const where: {
      patientId?: string;
      cashierId?: string;
      status?: string;
      type?: string;
      OR?: unknown[];
    } = {};
    
    if (patientId) {
      where.patientId = patientId;
    }
    
    if (cashierId) {
      where.cashierId = cashierId;
    }
    
    if (type) {
      where.type = type;
    }

    const totalCount = await prisma.sale.count({ where: where as never });

    const sales = await prisma.sale.findMany({
      where: where as never,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
          }
        },
        cashier: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Obtener los items de cada venta desde TransactionItem
    const salesWithItems = await Promise.all(
      sales.map(async (sale) => {
        const items = await prisma.transactionItem.findMany({
          where: {
            sourceType: 'sale',
            sourceId: sale.id
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
          ...sale,
          items
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      sales: salesWithItems,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/sales - Crear venta directa
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: CreateSaleData = await request.json();
    const { patientId, cashierId, type, notes, items } = body;

    // Validar campos requeridos
    if (!cashierId) {
      return NextResponse.json({ error: 'cashierId es requerido' }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Debe incluir al menos un item' }, { status: 400 });
    }

    // Verificar que el paciente existe (si se proporcionó)
    if (patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId }
      });

      if (!patient) {
        return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
      }
    }

    // Crear la venta
    const newSale = await prisma.sale.create({
      data: {
        patientId: patientId || null,
        cashierId,
        type: type || 'pharmacy',
        notes: notes || null,
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
        cashier: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      }
    });

    // Crear los TransactionItems
    const createdItems = await Promise.all(
      items.map(async (item) => {
        return await prisma.transactionItem.create({
          data: {
            sourceType: 'sale',
            sourceId: newSale.id,
            serviceItemId: item.serviceItemId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            nombre: item.nombre,
            precioUnitario: item.precioUnitario,
            descuento: item.descuento || 0,
            total: item.total,
            addedBy: session.user.id,
            notes: item.notes || null,
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

    // Crear el pago automáticamente
    const totalItems = createdItems.reduce((sum, item) => sum + item.total, 0);
    
    const paymentData: {
      saleId: string;
      status: string;
      total: number;
      createdBy: string;
      patientId?: string;
    } = {
      saleId: newSale.id,
      status: 'pendiente',
      total: totalItems,
      createdBy: session.user.id,
    };
    
    if (patientId) {
      paymentData.patientId = patientId;
    }

    const payment = await prisma.payment.create({
      data: paymentData as never,
    });

    // Retornar la venta con sus items
    return NextResponse.json({
      ...newSale,
      items: createdItems,
      payment
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ error: 'Error al crear la venta' }, { status: 500 });
  }
}

