import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { extractISVFromTotal } from '@/lib/calculations';

// POST /api/invoices/generate - Generar factura legal o recibo simple
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      paymentId, 
      useRTN, 
      clienteRTN, 
      clienteNombre, 
      detalleGenerico,
      observaciones,
      paymentMethod 
    } = body;

    // Validar que paymentMethod sea válido
    const validPaymentMethods = ['efectivo', 'tarjeta', 'transferencia'];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json({ 
        error: 'Método de pago inválido. Debe ser: efectivo, tarjeta o transferencia' 
      }, { status: 400 });
    }

    // Validar que el pago existe y obtener su fuente
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        patient: true,
        consultation: true,
        sale: true,
        hospitalization: true,
        surgery: true,
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // Obtener items desde la fuente (NO duplicar)
    let sourceType: string | null = null;
    let sourceId: string | null = null;

    if (payment.consultationId) {
      sourceType = 'consultation';
      sourceId = payment.consultationId;
    } else if (payment.saleId) {
      sourceType = 'sale';
      sourceId = payment.saleId;
    } else if (payment.hospitalizationId) {
      sourceType = 'hospitalization';
      sourceId = payment.hospitalizationId;
    } else if (payment.surgeryId) {
      sourceType = 'surgery';
      sourceId = payment.surgeryId;
    }

    if (!sourceType || !sourceId) {
      return NextResponse.json({ error: 'El pago no tiene una fuente válida' }, { status: 400 });
    }

    // Obtener los items desde TransactionItem
    const items = await prisma.transactionItem.findMany({
      where: {
        sourceType,
        sourceId
      },
      include: {
        serviceItem: true,
        variant: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    if (items.length === 0) {
      return NextResponse.json({ error: 'El pago no tiene items' }, { status: 400 });
    }

    // Calcular montos usando funciones validadas
    const total = payment.total;
    const { subtotal, isv } = extractISVFromTotal(total);
    const descuentos = 0; // Por ahora sin descuentos

    if (useRTN && clienteRTN) {
      // ============================================
      // GENERAR FACTURA LEGAL CON RTN
      // ============================================

      // Buscar rango de facturación activo
      const invoiceRange = await prisma.invoiceRange.findFirst({
        where: {
          estado: 'activo',
          correlativoActual: {
            lt: prisma.invoiceRange.fields.rangoFin // correlativo < rangoFin
          },
          fechaLimiteEmision: {
            gt: new Date() // Fecha límite no vencida
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!invoiceRange) {
        return NextResponse.json({ 
          error: 'No hay rangos de facturación activos disponibles' 
        }, { status: 400 });
      }

      // Calcular siguiente correlativo
      const correlativo = invoiceRange.correlativoActual + 1;

      // Validar que no exceda el rango
      if (correlativo > invoiceRange.rangoFin) {
        // Marcar rango como agotado
        await prisma.invoiceRange.update({
          where: { id: invoiceRange.id },
          data: { estado: 'agotado' }
        });

        return NextResponse.json({ 
          error: 'El rango de facturación se ha agotado. Configure un nuevo rango.' 
        }, { status: 400 });
      }

      // Generar número de factura
      const numeroFactura = `${invoiceRange.puntoEmision}-01-${String(correlativo).padStart(8, '0')}`;

      // Crear factura legal (SIN duplicar items)
      const invoice = await prisma.invoice.create({
        data: {
          paymentId: payment.id,
          type: 'legal',
          
          // Información del documento
          numeroDocumento: numeroFactura,
          fechaEmision: new Date(),
          
          // Información del emisor
          emisorNombre: invoiceRange.nombreComercial,
          emisorRTN: invoiceRange.rtn,
          emisorRazonSocial: invoiceRange.razonSocial,
          
          // Información del cliente
          clienteNombre,
          clienteIdentidad: payment.patient.identityNumber,
          clienteRTN,
          
          // Detalle y montos
          detalleGenerico: detalleGenerico || false,
          subtotal,
          descuentos,
          isv,
          total,
          observaciones,
          
          // Datos fiscales
          invoiceRangeId: invoiceRange.id,
          correlativo,
          cai: invoiceRange.cai,
        },
        include: {
          payment: {
            include: {
              patient: true,
            }
          },
          invoiceRange: true,
        }
      });

      // Incrementar correlativo del rango
      await prisma.invoiceRange.update({
        where: { id: invoiceRange.id },
        data: { correlativoActual: correlativo }
      });

      // Actualizar estado del pago a "paid" y guardar método de pago
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'paid',
          paymentMethod 
        }
      });

      // Mapear TransactionItem a formato de LegalInvoiceItem
      const mappedItems = items.map(item => ({
        id: item.id,
        nombre: item.nombre,
        cantidad: item.quantity, // TransactionItem usa 'quantity'
        precioUnitario: item.precioUnitario,
        total: item.total,
        createdAt: item.createdAt,
      }));

      return NextResponse.json({ 
        type: 'legal',
        invoice: {
          ...invoice,
          items: mappedItems // Agregar items mapeados
        }
      }, { status: 201 });

    } else {
      // ============================================
      // GENERAR RECIBO SIMPLE SIN RTN
      // ============================================

      // Generar número de recibo secuencial
      const lastReceipt = await prisma.invoice.findFirst({
        where: { type: 'simple' },
        orderBy: { createdAt: 'desc' },
        select: { numeroDocumento: true }
      });

      let nextNumber = 1;
      if (lastReceipt) {
        const match = lastReceipt.numeroDocumento.match(/REC-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      const numeroRecibo = `REC-${String(nextNumber).padStart(6, '0')}`;

      // Crear recibo simple (SIN duplicar items)
      const invoice = await prisma.invoice.create({
        data: {
          paymentId: payment.id,
          type: 'simple',
          
          // Información del documento
          numeroDocumento: numeroRecibo,
          fechaEmision: new Date(),
          
          // Información del emisor
          emisorNombre: "Hospital Zuniga, S. DE R. L.", // TODO: Obtener de configuración
          
          // Información del cliente
          clienteNombre: clienteNombre || `${payment.patient.firstName} ${payment.patient.lastName}`,
          clienteIdentidad: payment.patient.identityNumber,
          
          // Detalle y montos
          detalleGenerico: detalleGenerico || false,
          subtotal,
          descuentos,
          isv,
          total,
          observaciones,
        },
        include: {
          payment: {
            include: {
              patient: true,
            }
          },
        }
      });

      // Actualizar estado del pago a "paid" y guardar método de pago
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'paid',
          paymentMethod 
        }
      });

      // Mapear TransactionItem a formato de SimpleReceiptItem
      const mappedItems = items.map(item => ({
        id: item.id,
        nombre: item.nombre,
        cantidad: item.quantity, // TransactionItem usa 'quantity'
        precioUnitario: item.precioUnitario,
        total: item.total,
        createdAt: item.createdAt,
      }));

      return NextResponse.json({ 
        type: 'simple',
        invoice: {
          ...invoice,
          items: mappedItems // Agregar items mapeados
        }
      }, { status: 201 });
    }

  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json({ error: 'Error al generar la factura' }, { status: 500 });
  }
}

