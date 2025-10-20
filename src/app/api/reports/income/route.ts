import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/reports/income - Reporte de Ingresos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!["admin"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para acceder a reportes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tagsParam = searchParams.get('tags'); // Comma-separated tag IDs
    const specialtyId = searchParams.get('specialtyId');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Se requieren fechas de inicio y fin' },
        { status: 400 }
      );
    }

    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];

    // Construir filtro de fechas
    const dateFilter = {
      fechaEmision: {
        gte: new Date(startDate),
        lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    };

    // Obtener todas las facturas en el rango de fechas
    const invoices = await prisma.invoice.findMany({
      where: dateFilter,
      include: {
        payment: {
          include: {
            patient: true,
            consultation: {
              include: {
                doctor: {
                  include: {
                    specialty: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        fechaEmision: 'asc'
      }
    });

    // Obtener todos los transaction items de estas facturas
    const paymentIds = invoices.map(inv => inv.paymentId);
    const allTransactionItems = await prisma.transactionItem.findMany({
      where: {
        OR: invoices.map(inv => {
          if (inv.payment.consultationId) {
            return { sourceType: 'consultation', sourceId: inv.payment.consultationId };
          } else if (inv.payment.saleId) {
            return { sourceType: 'sale', sourceId: inv.payment.saleId };
          } else if (inv.payment.hospitalizationId) {
            return { sourceType: 'hospitalization', sourceId: inv.payment.hospitalizationId };
          } else if (inv.payment.surgeryId) {
            return { sourceType: 'surgery', sourceId: inv.payment.surgeryId };
          }
          return { sourceType: 'none', sourceId: 'none' };
        })
      },
      include: {
        serviceItem: {
          include: {
            tags: {
              include: {
                tag: true
              }
            }
          }
        }
      }
    });

    // Filtrar por especialidad si se especifica
    let filteredInvoices = invoices;
    if (specialtyId) {
      filteredInvoices = invoices.filter(inv => 
        inv.payment.consultation?.doctor?.specialty?.id === specialtyId
      );
    }

    // Filtrar por tags si se especifican
    if (tags.length > 0) {
      const invoiceIdsWithTags = new Set<string>();
      
      allTransactionItems.forEach(item => {
        const itemTags = item.serviceItem?.tags?.map(st => st.tag.id) || [];
        const hasMatchingTag = tags.some(tag => itemTags.includes(tag));
        
        if (hasMatchingTag) {
          // Encontrar el invoice que corresponde a este item
          const invoice = invoices.find(inv => {
            if (inv.payment.consultationId && item.sourceType === 'consultation' && item.sourceId === inv.payment.consultationId) return true;
            if (inv.payment.saleId && item.sourceType === 'sale' && item.sourceId === inv.payment.saleId) return true;
            if (inv.payment.hospitalizationId && item.sourceType === 'hospitalization' && item.sourceId === inv.payment.hospitalizationId) return true;
            if (inv.payment.surgeryId && item.sourceType === 'surgery' && item.sourceId === inv.payment.surgeryId) return true;
            return false;
          });
          
          if (invoice) {
            invoiceIdsWithTags.add(invoice.id);
          }
        }
      });
      
      filteredInvoices = filteredInvoices.filter(inv => invoiceIdsWithTags.has(inv.id));
    }

    // Mapear items por invoice
    const itemsByInvoice = new Map<string, typeof allTransactionItems>();
    filteredInvoices.forEach(inv => {
      const sourceType = inv.payment.consultationId ? 'consultation' 
        : inv.payment.saleId ? 'sale' 
        : inv.payment.hospitalizationId ? 'hospitalization'
        : inv.payment.surgeryId ? 'surgery'
        : null;
      const sourceId = inv.payment.consultationId || inv.payment.saleId || inv.payment.hospitalizationId || inv.payment.surgeryId;
      
      if (sourceType && sourceId) {
        const items = allTransactionItems.filter(item => 
          item.sourceType === sourceType && item.sourceId === sourceId
        );
        itemsByInvoice.set(inv.id, items);
      }
    });

    // Preparar detalles
    const details = filteredInvoices.map(inv => ({
      id: inv.id,
      numeroDocumento: inv.numeroDocumento,
      fechaEmision: inv.fechaEmision,
      clienteNombre: inv.clienteNombre,
      clienteIdentidad: inv.clienteIdentidad,
      total: inv.total,
      items: (itemsByInvoice.get(inv.id) || []).map((item) => ({
        id: item.id,
        nombre: item.nombre,
        quantity: item.quantity,
        precioUnitario: item.precioUnitario,
        total: item.total
      }))
    }));

    // Calcular resumen por tags
    const tagTotals = new Map<string, { count: number; total: number }>();
    allTransactionItems.forEach(item => {
      const itemTags = item.serviceItem?.tags || [];
      itemTags.forEach(st => {
        const tagName = st.tag.name;
        if (!tagTotals.has(tagName)) {
          tagTotals.set(tagName, { count: 0, total: 0 });
        }
        const current = tagTotals.get(tagName)!;
        tagTotals.set(tagName, {
          count: current.count + 1,
          total: current.total + item.total
        });
      });
    });

    const byTag = Array.from(tagTotals.entries()).map(([tagName, data]) => ({
      tagName,
      count: data.count,
      total: data.total
    }));

    // Calcular resumen por especialidad
    const specialtyTotals = new Map<string, { count: number; total: number }>();
    filteredInvoices.forEach(inv => {
      if (inv.payment.consultation?.doctor?.specialty) {
        const specialtyName = inv.payment.consultation.doctor.specialty.name;
        if (!specialtyTotals.has(specialtyName)) {
          specialtyTotals.set(specialtyName, { count: 0, total: 0 });
        }
        const current = specialtyTotals.get(specialtyName)!;
        specialtyTotals.set(specialtyName, {
          count: current.count + 1,
          total: current.total + inv.total
        });
      }
    });

    const bySpecialty = Array.from(specialtyTotals.entries()).map(([specialtyName, data]) => ({
      specialtyName,
      count: data.count,
      total: data.total
    }));

    // Preparar respuesta
    const response = {
      summary: {
        totalInvoices: filteredInvoices.length,
        totalAmount: filteredInvoices.reduce((sum, inv) => sum + inv.total, 0),
        byTag,
        bySpecialty
      },
      details
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error al generar reporte de ingresos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

