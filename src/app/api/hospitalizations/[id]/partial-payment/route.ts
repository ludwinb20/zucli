import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { calculatePendingDays, hasDaysOverlap, getDailyRate } from '@/lib/hospitalization-helpers';
import { extractISVFromTotal, calculateISV } from '@/lib/calculations';

// POST /api/hospitalizations/[id]/partial-payment - Crear un pago parcial de hospitalización
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos - solo caja y admin pueden crear pagos
    if (!['caja', 'admin'].includes(session.user.role?.name || '')) {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      endDate, 
      daysToBill, 
      customAmount,
      // Nuevos parámetros para facturación
      generateInvoice = false,
      paymentMethod,
      partialPayments,
      useRTN = false,
      clienteRTN,
      clienteNombre,
      detalleGenerico = false,
      observaciones,
    } = body;

    // Obtener hospitalización con sus pagos y configuración de tarifa
    const hospitalization = await prisma.hospitalization.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
          },
        },
        dailyRateItem: {
          select: {
            id: true,
            name: true,
            basePrice: true,
          },
        },
        dailyRateVariant: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        payments: {
          where: {
            isActive: true,
            status: { not: 'cancelado' },
          },
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            daysCoveredStartDate: true,
            daysCoveredEndDate: true,
            daysCount: true,
            total: true,
            status: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!hospitalization) {
      return NextResponse.json(
        { error: 'Hospitalización no encontrada' },
        { status: 404 }
      );
    }

    // Validar que tenga tarifa diaria configurada
    if (!hospitalization.dailyRateItemId) {
      return NextResponse.json(
        { error: 'La hospitalización no tiene tarifa diaria configurada' },
        { status: 400 }
      );
    }

    // Validar que la hospitalización esté activa (no se puede cobrar después de alta si ya se cobró todo)
    if (hospitalization.status === 'completada') {
      // Verificar si ya se cobró todo
      const pending = calculatePendingDays(
        hospitalization.admissionDate,
        hospitalization.payments,
        hospitalization.dischargeDate || new Date()
      );

      if (!pending.hasPendingDays) {
        return NextResponse.json(
          { error: 'Esta hospitalización ya ha sido pagada completamente' },
          { status: 400 }
        );
      }
    }

    // Calcular días pendientes disponibles
    const referenceDate = endDate ? new Date(endDate) : new Date();
    const pending = calculatePendingDays(
      hospitalization.admissionDate,
      hospitalization.payments,
      referenceDate
    );

    if (!pending.hasPendingDays || pending.daysCount === 0) {
      return NextResponse.json(
        { error: 'No hay días pendientes de pago para esta hospitalización' },
        { status: 400 }
      );
    }

    // Validar días a facturar si se proporciona
    const daysToBillCount = daysToBill ? parseInt(daysToBill) : pending.daysCount;
    if (isNaN(daysToBillCount) || daysToBillCount < 1 || daysToBillCount > pending.daysCount) {
      return NextResponse.json(
        { error: `Debes seleccionar entre 1 y ${pending.daysCount} día(s)` },
        { status: 400 }
      );
    }

    // Calcular la fecha de fin basada en los días seleccionados
    const finalStartDate = pending.startDate;
    const finalEndDate = new Date(finalStartDate);
    finalEndDate.setDate(finalEndDate.getDate() + daysToBillCount - 1); // -1 porque el primer día ya está incluido

    // Validar que no haya solapamiento con los pagos existentes
    if (hasDaysOverlap(finalStartDate, finalEndDate, hospitalization.payments)) {
      return NextResponse.json(
        { error: 'Hay solapamiento con días ya cobrados. Por favor recarga la página e intenta de nuevo.' },
        { status: 400 }
      );
    }

    // Obtener la tarifa diaria
    const dailyRate = getDailyRate(hospitalization.dailyRateItem, hospitalization.dailyRateVariant);

    // Calcular el total del pago parcial basado en los días seleccionados
    const calculatedTotal = daysToBillCount * dailyRate;

    // Validar y usar monto personalizado si se proporciona
    let totalCost = calculatedTotal;
    if (customAmount !== null && customAmount !== undefined) {
      const customAmountNum = parseFloat(customAmount);
      if (isNaN(customAmountNum) || customAmountNum <= 0) {
        return NextResponse.json(
          { error: 'El monto personalizado debe ser un número válido mayor a 0' },
          { status: 400 }
        );
      }
      if (customAmountNum > calculatedTotal) {
        return NextResponse.json(
          { error: `El monto personalizado no puede ser mayor que L${calculatedTotal.toFixed(2)}` },
          { status: 400 }
        );
      }
      totalCost = customAmountNum;
    }

    // Validar método de pago si se va a generar factura
    if (generateInvoice) {
      if (!paymentMethod && (!partialPayments || !Array.isArray(partialPayments) || partialPayments.length === 0)) {
        return NextResponse.json(
          { error: 'Debe proporcionar un método de pago para generar la factura' },
          { status: 400 }
        );
      }

      // Validar pagos parciales si se proporcionan
      if (partialPayments && Array.isArray(partialPayments) && partialPayments.length > 0) {
        const validMethods = ['efectivo', 'tarjeta', 'transferencia'];
        let totalPartial = 0;

        for (const pp of partialPayments) {
          if (!pp.method || !validMethods.includes(pp.method)) {
            return NextResponse.json(
              { error: `Método de pago inválido: ${pp.method}. Debe ser: efectivo, tarjeta o transferencia` },
              { status: 400 }
            );
          }
          if (typeof pp.amount !== 'number' || pp.amount <= 0) {
            return NextResponse.json(
              { error: 'Todos los montos de pago parcial deben ser números válidos mayores a 0' },
              { status: 400 }
            );
          }
          totalPartial += pp.amount;
        }

        // Validar que la suma de pagos parciales sea igual al total
        if (Math.abs(totalPartial - totalCost) > 0.01) {
          return NextResponse.json(
            { error: `La suma de los pagos parciales (L${totalPartial.toFixed(2)}) debe ser igual al total (L${totalCost.toFixed(2)})` },
            { status: 400 }
          );
        }
      }
    }

    // Crear TransactionItem para los días seleccionados ANTES de crear el pago
    if (!hospitalization.dailyRateItemId) {
      return NextResponse.json(
        { error: 'La hospitalización no tiene tarifa diaria configurada' },
        { status: 400 }
      );
    }

    // Obtener el nombre del item para el snapshot
    const serviceItem = await prisma.serviceItem.findUnique({
      where: { id: hospitalization.dailyRateItemId },
      select: { name: true }
    });

    if (!serviceItem) {
      return NextResponse.json(
        { error: 'No se encontró el servicio de tarifa diaria' },
        { status: 404 }
      );
    }

    // Crear el TransactionItem
    const transactionItem = await prisma.transactionItem.create({
      data: {
        sourceType: 'hospitalization',
        sourceId: hospitalization.id,
        serviceItemId: hospitalization.dailyRateItemId,
        variantId: hospitalization.dailyRateVariantId || null,
        quantity: daysToBillCount,
        nombre: `${serviceItem.name}${hospitalization.dailyRateVariant ? ` - ${hospitalization.dailyRateVariant.name}` : ''} (${daysToBillCount} día${daysToBillCount !== 1 ? 's' : ''})`,
        precioUnitario: dailyRate,
        descuento: customAmount ? calculatedTotal - totalCost : 0,
        total: totalCost,
        addedBy: session.user.id,
        notes: `Pago parcial de hospitalización por ${daysToBillCount} día(s) desde ${finalStartDate.toLocaleDateString('es-ES')} hasta ${finalEndDate.toLocaleDateString('es-ES')}`,
      },
    });

    // Determinar el método de pago para el Payment
    const finalPaymentMethod = partialPayments && partialPayments.length > 0 
      ? partialPayments[0].method 
      : paymentMethod || 'efectivo';

    // Crear el pago parcial
    const payment = await prisma.payment.create({
      data: {
        patientId: hospitalization.patientId,
        hospitalizationId: hospitalization.id,
        total: totalCost,
        status: generateInvoice ? 'pagado' : 'pendiente',
        paymentMethod: generateInvoice ? finalPaymentMethod : null,
        daysCoveredStartDate: finalStartDate,
        daysCoveredEndDate: finalEndDate,
        daysCount: daysToBillCount,
        createdBy: session.user.id,
        notes: `Pago parcial de hospitalización: ${daysToBillCount} día(s) desde ${finalStartDate.toLocaleDateString('es-ES')} hasta ${finalEndDate.toLocaleDateString('es-ES')}`,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
          },
        },
      },
    });

    // Si se va a generar factura, hacerlo ahora
    let invoice = null;
    if (generateInvoice) {
      // Guardar pagos parciales si se proporcionan
      if (partialPayments && Array.isArray(partialPayments) && partialPayments.length > 0) {
        await prisma.partialPayment.deleteMany({
          where: { paymentId: payment.id },
        });

        await prisma.partialPayment.createMany({
          data: partialPayments.map(pp => ({
            paymentId: payment.id,
            method: pp.method,
            amount: pp.amount,
          })),
        });
      }

      // Usar solo el TransactionItem que acabamos de crear para este pago parcial
      const items = [transactionItem];

      // Calcular subtotal de items (solo del item creado)
      const subtotalItems = items.reduce((sum, item) => sum + item.total, 0);
      
      // Extraer el subtotal antes del ISV
      const { subtotal: subtotalSinISV } = extractISVFromTotal(subtotalItems);
      
      // Obtener descuentos del pago (si aplica)
      const descuentos = customAmount ? calculatedTotal - totalCost : 0;
      const subtotalConDescuento = subtotalSinISV - descuentos;
      
      // Recalcular ISV sobre el subtotal con descuento
      const isv = calculateISV(subtotalConDescuento);
      
      // El subtotal usado en la factura es el subtotal sin ISV (después de descuento)
      const subtotal = subtotalConDescuento;
      
      // El total final es el que viene del payment
      const total = payment.total;

      if (useRTN && clienteRTN) {
        // Generar factura legal
        const invoiceRange = await prisma.invoiceRange.findFirst({
          where: {
            estado: 'activo',
            correlativoActual: {
              lt: prisma.invoiceRange.fields.rangoFin
            },
            fechaLimiteEmision: {
              gt: new Date()
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        if (!invoiceRange) {
          // Si no hay rango, hacer rollback del pago creado
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'pendiente', paymentMethod: null }
          });
          return NextResponse.json(
            { error: 'No hay rangos de facturación activos disponibles' },
            { status: 400 }
          );
        }

        const correlativo = invoiceRange.correlativoActual + 1;

        if (correlativo > invoiceRange.rangoFin) {
          await prisma.invoiceRange.update({
            where: { id: invoiceRange.id },
            data: { estado: 'agotado' }
          });
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'pendiente', paymentMethod: null }
          });
          return NextResponse.json(
            { error: 'El rango de facturación se ha agotado. Configure un nuevo rango.' },
            { status: 400 }
          );
        }

        const numeroFactura = `${invoiceRange.puntoEmision}-01-${String(correlativo).padStart(8, '0')}`;

        invoice = await prisma.invoice.create({
          data: {
            paymentId: payment.id,
            type: 'legal',
            numeroDocumento: numeroFactura,
            fechaEmision: new Date(),
            emisorNombre: invoiceRange.nombreComercial,
            emisorRTN: invoiceRange.rtn,
            emisorRazonSocial: invoiceRange.razonSocial,
            clienteNombre: clienteNombre || `${hospitalization.patient.firstName} ${hospitalization.patient.lastName}`,
            clienteIdentidad: hospitalization.patient.identityNumber,
            clienteRTN,
            detalleGenerico,
            subtotal,
            descuentos,
            isv,
            total,
            observaciones: observaciones || null,
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

        await prisma.invoiceRange.update({
          where: { id: invoiceRange.id },
          data: { correlativoActual: correlativo }
        });
      } else {
        // Generar recibo simple
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

        invoice = await prisma.invoice.create({
          data: {
            paymentId: payment.id,
            type: 'simple',
            numeroDocumento: numeroRecibo,
            fechaEmision: new Date(),
            emisorNombre: "Hospital Zuniga, S. DE R. L.",
            clienteNombre: clienteNombre || `${hospitalization.patient.firstName} ${hospitalization.patient.lastName}`,
            clienteIdentidad: hospitalization.patient.identityNumber,
            detalleGenerico,
            subtotal,
            descuentos,
            isv,
            total,
            observaciones: observaciones || null,
          },
          include: {
            payment: {
              include: {
                patient: true,
              }
            },
          }
        });
      }

      // Mapear items para la respuesta
      const mappedItems = items.map(item => ({
        id: item.id,
        nombre: item.nombre,
        cantidad: item.quantity,
        precioUnitario: item.precioUnitario,
        total: item.total,
        createdAt: item.createdAt,
      }));

      return NextResponse.json({
        payment,
        invoice: {
          ...invoice,
          items: mappedItems,
        },
        invoiceType: invoice.type,
        pendingDays: {
          daysCount: daysToBillCount,
          startDate: finalStartDate.toISOString(),
          endDate: finalEndDate.toISOString(),
          totalCost,
        },
      });
    }

    return NextResponse.json({
      payment,
      pendingDays: {
        daysCount: daysToBillCount,
        startDate: finalStartDate.toISOString(),
        endDate: finalEndDate.toISOString(),
        totalCost,
      },
    });
  } catch (error) {
    console.error('Error creating partial payment:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

