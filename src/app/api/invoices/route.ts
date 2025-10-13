import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaWhereFilter } from '@/types/api';

// GET /api/invoices - Obtener todas las facturas (legales y recibos simples)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'legal', 'simple', o 'all'
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    // Construir filtros para el modelo unificado Invoice
    const where: PrismaWhereFilter = {};
    
    // Filtrar por tipo si no es 'all'
    if (type === 'legal') {
      where.type = 'legal';
    } else if (type === 'simple') {
      where.type = 'simple';
    }
    
    // Filtrar por búsqueda
    if (search) {
      where.OR = [
        { clienteNombre: { contains: search } },
        { numeroDocumento: { contains: search } },
        { clienteIdentidad: { contains: search } },
        { clienteRTN: { contains: search } },
      ];
    }

    // Obtener facturas/recibos
    const invoicesFromDB = await prisma.invoice.findMany({
      where,
      include: {
        payment: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                identityNumber: true,
              }
            }
          }
        },
        invoiceRange: true, // Incluir el rango para facturas legales
      },
      orderBy: {
        fechaEmision: 'desc'
      },
      take: limit,
      skip: offset,
    });

    // Cargar todos los items de los pagos en una sola query
    const allItems = await prisma.transactionItem.findMany({
      where: {
        OR: invoicesFromDB.map(inv => {
          // Determinar sourceType y sourceId según el payment
          if (inv.payment.consultationId) {
            return { sourceType: 'consultation', sourceId: inv.payment.consultationId };
          } else if (inv.payment.saleId) {
            return { sourceType: 'sale', sourceId: inv.payment.saleId };
          } else if (inv.payment.hospitalizationId) {
            return { sourceType: 'hospitalization', sourceId: inv.payment.hospitalizationId };
          }
          return { sourceType: 'none', sourceId: 'none' }; // Fallback
        })
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Agrupar items por payment
    const itemsByPayment = new Map<string, { id: string, nombre: string, quantity: number, precioUnitario: number, total: number, createdAt: Date }[]>();
    for (const inv of invoicesFromDB) {
      const sourceType = inv.payment.consultationId ? 'consultation' 
        : inv.payment.saleId ? 'sale' 
        : inv.payment.hospitalizationId ? 'hospitalization' 
        : null;
      const sourceId = inv.payment.consultationId || inv.payment.saleId || inv.payment.hospitalizationId;
      
      if (sourceType && sourceId) {
        const items = allItems.filter(item => item.sourceType === sourceType && item.sourceId === sourceId);
        itemsByPayment.set(inv.paymentId, items);
      }
    }

    // Mapear a formato de respuesta
    const invoices = invoicesFromDB.map(inv => {
      const items = itemsByPayment.get(inv.paymentId) || [];
      
      // Mapear items a formato con 'cantidad'
      const mappedItems = items.map(item => ({
        id: item.id,
        nombre: item.nombre,
        cantidad: item.quantity, // Convertir quantity → cantidad
        precioUnitario: item.precioUnitario,
        total: item.total,
        createdAt: item.createdAt,
      }));

      return {
        id: inv.id,
        type: inv.type,
        numero: inv.numeroDocumento,
        fecha: inv.fechaEmision,
        clienteNombre: inv.clienteNombre,
        clienteRTN: inv.clienteRTN || undefined,
        total: inv.total,
        detalleGenerico: inv.detalleGenerico,
        patientName: `${inv.payment.patient.firstName} ${inv.payment.patient.lastName}`,
        patientIdentity: inv.payment.patient.identityNumber,
        raw: {
          ...inv,
          items: mappedItems, // Agregar items mapeados
        },
      };
    });

    // Contar total
    const totalCount = await prisma.invoice.count({ where });

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      invoices,
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
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

