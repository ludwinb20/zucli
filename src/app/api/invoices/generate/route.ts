import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { extractISVFromTotal, calculateISV } from '@/lib/calculations';

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
      paymentMethod, // Mantener para compatibilidad
      partialPayments // Nuevo: array de pagos parciales
    } = body;

    // Validar pagos parciales o método de pago único
    let partialPaymentsData: Array<{ method: string; amount: number }> = [];
    
    if (partialPayments && Array.isArray(partialPayments) && partialPayments.length > 0) {
      // Validar pagos parciales
      const validMethods = ['efectivo', 'tarjeta', 'transferencia'];
      let totalPartial = 0;

      for (const pp of partialPayments) {
        if (!pp.method || !validMethods.includes(pp.method)) {
          return NextResponse.json({ 
            error: `Método de pago inválido: ${pp.method}. Debe ser: efectivo, tarjeta o transferencia` 
          }, { status: 400 });
        }
        if (typeof pp.amount !== 'number' || pp.amount <= 0) {
          return NextResponse.json({ 
            error: 'Todos los montos de pago parcial deben ser números válidos mayores a 0' 
          }, { status: 400 });
        }
        totalPartial += pp.amount;
      }

      partialPaymentsData = partialPayments;
    } else if (paymentMethod) {
      // Compatibilidad: si solo hay un método de pago, convertirlo a formato de pagos parciales
      const validPaymentMethods = ['efectivo', 'tarjeta', 'transferencia'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        return NextResponse.json({ 
          error: 'Método de pago inválido. Debe ser: efectivo, tarjeta o transferencia' 
        }, { status: 400 });
      }
      // Se creará el pago parcial después de validar el total
    } else {
      return NextResponse.json({ 
        error: 'Debe proporcionar al menos un método de pago (paymentMethod o partialPayments)' 
      }, { status: 400 });
    }

    // Validar que el pago existe, está activo y obtener su fuente
    const payment = await prisma.payment.findFirst({
      where: { 
        id: paymentId,
        isActive: true, // Solo pagos activos pueden generar facturas
      },
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

    // Validar que la suma de pagos parciales sea igual al total
    if (partialPaymentsData.length > 0) {
      const totalPartial = partialPaymentsData.reduce((sum, pp) => sum + pp.amount, 0);
      const totalPayment = payment.total;
      const difference = Math.abs(totalPayment - totalPartial);
      
      if (difference > 0.01) {
        return NextResponse.json({ 
          error: `La suma de los pagos parciales (${totalPartial.toFixed(2)}) debe ser igual al total del pago (${totalPayment.toFixed(2)}). Diferencia: ${difference.toFixed(2)}` 
        }, { status: 400 });
      }
    } else if (paymentMethod) {
      // Si es método único, crear un pago parcial con el total completo
      partialPaymentsData = [{
        method: paymentMethod,
        amount: payment.total,
      }];
    }

    // Calcular montos usando funciones validadas
    // Los precios de los items YA incluyen ISV, así que necesitamos extraerlo
    
    // Calcular subtotal de items (los items ya incluyen ISV en su total)
    const subtotalItems = items.reduce((sum, item) => sum + item.total, 0);
    
    // Extraer el subtotal antes del ISV (los precios ya incluyen ISV)
    const { subtotal: subtotalSinISV } = extractISVFromTotal(subtotalItems);
    
    // Obtener descuentos del pago (se aplican al subtotal sin ISV)
    const descuentos = payment.discountAmount || 0;
    const subtotalConDescuento = subtotalSinISV - descuentos;
    
    // Recalcular ISV sobre el subtotal con descuento (15% del subtotal con descuento)
    const isv = calculateISV(subtotalConDescuento);
    
    // El subtotal usado en la factura es el subtotal sin ISV (después de descuento)
    const subtotal = subtotalConDescuento;
    
    // El total final es el que viene del payment (ya está correcto)
    const total = payment.total;

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

      // Guardar pagos parciales
      await prisma.partialPayment.deleteMany({
        where: { paymentId: payment.id },
      });

      await prisma.partialPayment.createMany({
        data: partialPaymentsData.map(pp => ({
          paymentId: payment.id,
          method: pp.method,
          amount: pp.amount,
        })),
      });

      // Actualizar estado del pago a "paid" y guardar método de pago (usar el primer método para compatibilidad)
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'paid',
          paymentMethod: partialPaymentsData.length > 0 ? partialPaymentsData[0].method : paymentMethod
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

      // Guardar pagos parciales
      await prisma.partialPayment.deleteMany({
        where: { paymentId: payment.id },
      });

      await prisma.partialPayment.createMany({
        data: partialPaymentsData.map(pp => ({
          paymentId: payment.id,
          method: pp.method,
          amount: pp.amount,
        })),
      });

      // Actualizar estado del pago a "paid" y guardar método de pago (usar el primer método para compatibilidad)
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'paid',
          paymentMethod: partialPaymentsData.length > 0 ? partialPaymentsData[0].method : paymentMethod
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

