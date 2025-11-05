import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UpdatePaymentData } from '@/types/payments';
import { calculateItemTotal, calculateDiscount, extractISVFromTotal, calculateISV, roundToDecimals } from '@/lib/calculations';

// GET /api/payments/[id] - Obtener un pago específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
          }
        },
        consultation: true,
        sale: true,
        hospitalization: true,
        surgery: true,
        refunds: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    return NextResponse.json(payment);

  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT /api/payments/[id] - Actualizar un pago
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos: solo caja y admin pueden editar pagos
    const allowedRoles = ['caja', 'admin'];
    if (!session.user.role?.name || !allowedRoles.includes(session.user.role.name)) {
      return NextResponse.json({ error: 'No tienes permisos para editar pagos' }, { status: 403 });
    }

    const { id } = await params;
    const body: UpdatePaymentData = await request.json();

    // Verificar que el pago existe
    const existingPayment = await prisma.payment.findUnique({
      where: { id },
      include: {
        sale: true,
        consultation: true,
        hospitalization: true,
      }
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // Solo se pueden editar pagos pendientes
    if (existingPayment.status !== 'pendiente') {
      return NextResponse.json({ error: 'Solo se pueden editar pagos pendientes' }, { status: 400 });
    }

    // Si se actualiza el estado
    if (body.status) {
      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          status: body.status,
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
          consultation: true,
          sale: true,
          hospitalization: true,
          surgery: true
        }
      });

      return NextResponse.json(updatedPayment);
    }

    // Si se actualizan los items
    if (body.items && Array.isArray(body.items)) {
      // Solo se pueden editar items de pagos que vienen de ventas directas
      if (!existingPayment.saleId) {
        return NextResponse.json({ 
          error: 'Solo se pueden editar items de pagos de ventas directas' 
        }, { status: 400 });
      }

      // Validar que hay items
      if (body.items.length === 0) {
        return NextResponse.json({ error: 'Debe haber al menos un item en el pago' }, { status: 400 });
      }

      // Validar y actualizar patientId si se proporciona
      let newPatientId = existingPayment.patientId;
      if (body.patientId) {
        // Verificar que el paciente existe
        const patient = await prisma.patient.findUnique({
          where: { id: body.patientId }
        });
        if (!patient) {
          return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
        }
        newPatientId = body.patientId;
      }

      // Eliminar los items existentes de la venta
      await prisma.transactionItem.deleteMany({
        where: {
          sourceType: 'sale',
          sourceId: existingPayment.saleId,
        }
      });

      // Validar items antes de crear
      for (const item of body.items) {
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

      // Crear los nuevos items
      const createdItems = await Promise.all(
        body.items.map(async (item) => {
          const isCustom = item.isCustom || false;
          return await prisma.transactionItem.create({
            data: {
              sourceType: 'sale',
              sourceId: existingPayment.saleId!,
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

      // Calcular subtotal de items (los precios ya incluyen ISV)
      const subtotalItems = createdItems.reduce((sum, item) => sum + item.total, 0);

      // Calcular descuento (usar el del body si existe, sino mantener el existente)
      const discountValue = body.discountValue !== undefined ? body.discountValue : existingPayment.discountValue;
      const discountType = body.discountType !== undefined ? body.discountType : existingPayment.discountType;
      const discountReason = body.discountReason !== undefined ? body.discountReason : existingPayment.discountReason;

      let discountAmount = 0;
      if (discountValue && discountValue > 0 && discountType) {
        try {
          // Extraer el subtotal antes del ISV del total de items
          // Los items ya incluyen ISV en sus precios, necesitamos extraer el subtotal base
          const { subtotal: subtotalSinISV } = extractISVFromTotal(subtotalItems);
          
          // El descuento se aplica sobre el subtotal antes del ISV
          discountAmount = calculateDiscount(
            subtotalSinISV,
            discountValue,
            discountType === 'percentage' ? 'porcentaje' : 'absoluto'
          );
        } catch (error) {
          return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Error al calcular el descuento' 
          }, { status: 400 });
        }
      }

      // Calcular nuevo total con descuento
      // Extraer subtotal antes del ISV, aplicar descuento, recalcular ISV y total
      const { subtotal: subtotalSinISV } = extractISVFromTotal(subtotalItems);
      const subtotalConDescuento = subtotalSinISV - discountAmount;
      const nuevoISV = calculateISV(subtotalConDescuento);
      const newTotal = roundToDecimals(subtotalConDescuento + nuevoISV);

      // Actualizar el pago con el nuevo total, descuentos y paciente
      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          patientId: newPatientId,
          total: newTotal,
          discountAmount: discountAmount || 0,
          discountType: discountType || null,
          discountValue: discountValue || null,
          discountReason: discountReason || null,
          notes: body.notes !== undefined ? body.notes : existingPayment.notes,
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
          consultation: true,
          sale: true,
          hospitalization: true,
          surgery: true,
          refunds: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      // Obtener los items desde TransactionItem
      const items = await prisma.transactionItem.findMany({
        where: {
          sourceType: 'sale',
          sourceId: existingPayment.saleId!,
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

      // Construir la respuesta con los items
      const response = {
        ...updatedPayment,
        items
      };

      return NextResponse.json(response);
    }

    // Si se actualizan solo los descuentos (sin items)
    if ((body.discountValue !== undefined || body.discountType !== undefined || body.discountReason !== undefined) && !body.items) {
      // Extraer el subtotal antes del ISV del total actual del pago
      const { subtotal: subtotalSinISV } = extractISVFromTotal(existingPayment.total);
      
      const discountValue = body.discountValue !== undefined ? body.discountValue : existingPayment.discountValue;
      const discountType = body.discountType !== undefined ? body.discountType : existingPayment.discountType;
      const discountReason = body.discountReason !== undefined ? body.discountReason : existingPayment.discountReason;

      let discountAmount = 0;
      if (discountValue && discountValue > 0 && discountType) {
        try {
          // El descuento se aplica sobre el subtotal antes del ISV
          discountAmount = calculateDiscount(
            subtotalSinISV,
            discountValue,
            discountType === 'percentage' ? 'porcentaje' : 'absoluto'
          );
        } catch (error) {
          return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Error al calcular el descuento' 
          }, { status: 400 });
        }
      }

      const subtotalConDescuento = subtotalSinISV - discountAmount;
      const nuevoISV = calculateISV(subtotalConDescuento);
      const newTotal = roundToDecimals(subtotalConDescuento + nuevoISV);

      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          total: newTotal,
          discountAmount: discountAmount || 0,
          discountType: discountType || null,
          discountValue: discountValue || null,
          discountReason: discountReason || null,
          notes: body.notes !== undefined ? body.notes : existingPayment.notes,
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
          consultation: true,
          sale: true,
          hospitalization: true,
          surgery: true
        }
      });

      return NextResponse.json(updatedPayment);
    }

    // Si solo se actualiza notes
    if (body.notes !== undefined && !body.discountValue && !body.discountType && !body.discountReason) {
      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: {
          notes: body.notes,
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
          consultation: true,
          sale: true,
          hospitalization: true,
          surgery: true
        }
      });

      return NextResponse.json(updatedPayment);
    }

    return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 });

  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Error al actualizar el pago' }, { status: 500 });
  }
}

// DELETE /api/payments/[id] - Eliminar un pago
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar permisos: solo caja y admin pueden eliminar pagos
    const allowedRoles = ['caja', 'admin'];
    if (!session.user.role?.name || !allowedRoles.includes(session.user.role.name)) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar pagos' }, { status: 403 });
    }

    const { id } = await params;

    // Verificar que el pago existe
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoices: {
          select: { id: true }
        },
        refunds: {
          select: { id: true }
        }
      }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // Solo se pueden eliminar pagos pendientes
    if (payment.status !== 'pendiente') {
      return NextResponse.json({ 
        error: 'Solo se pueden eliminar pagos pendientes' 
      }, { status: 400 });
    }

    // Verificar que no tenga facturas generadas
    if (payment.invoices && payment.invoices.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar un pago que ya tiene facturas generadas' 
      }, { status: 400 });
    }

    // Verificar que no tenga reembolsos
    if (payment.refunds && payment.refunds.length > 0) {
      return NextResponse.json({ 
        error: 'No se puede eliminar un pago que ya tiene reembolsos registrados' 
      }, { status: 400 });
    }

    // Eliminar el pago (los items se eliminarán en cascada)
    await prisma.payment.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Pago eliminado exitosamente' });

  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Error al eliminar el pago' }, { status: 500 });
  }
}

