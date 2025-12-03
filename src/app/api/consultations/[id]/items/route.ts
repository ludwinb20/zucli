import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateItemTotal } from "@/lib/calculations";

// POST /api/consultations/[id]/items - Agregar item a una consulta existente
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: consultationId } = await params;
    const body = await request.json();
    const { priceId, variantId, quantity } = body;

    // Validar campos requeridos
    if (!priceId) {
      return NextResponse.json(
        { error: "priceId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que la consulta existe
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: "Consulta no encontrada" },
        { status: 404 }
      );
    }

    // Obtener datos del serviceItem para crear el snapshot
    let itemName = '';
    let itemPrice = 0;
    
    if (variantId) {
      const variant = await prisma.serviceItemVariant.findUnique({
        where: { id: variantId },
        include: { serviceItem: true }
      });
      if (variant) {
        itemName = `${variant.serviceItem.name} - ${variant.name}`;
        itemPrice = variant.price;
      }
    } else {
      const serviceItem = await prisma.serviceItem.findUnique({
        where: { id: priceId }
      });
      if (serviceItem) {
        itemName = serviceItem.name;
        itemPrice = serviceItem.basePrice;
      }
    }

    const qty = quantity || 1;
    const total = calculateItemTotal(itemPrice, qty);

    // Crear el transaction item
    const consultationItem = await prisma.transactionItem.create({
      data: {
        sourceType: 'consultation',
        sourceId: consultationId,
        serviceItemId: priceId,
        variantId: variantId || null,
        quantity: qty,
        nombre: itemName,
        precioUnitario: itemPrice,
        descuento: 0,
        total,
        addedBy: session.user.id,
      },
      include: {
        serviceItem: {
          select: {
            id: true,
            name: true,
            type: true,
            basePrice: true,
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });

    // Actualizar el pago si está pendiente
    try {
      const consultationItems = await prisma.transactionItem.findMany({
        where: {
          sourceType: 'consultation',
          sourceId: consultationId
        }
      });

      const totalItems = consultationItems.reduce((sum, item) => sum + item.total, 0);

      const pendingPayment = await prisma.payment.findFirst({
        where: {
          consultationId: consultationId,
          status: 'pendiente'
        }
      });

      if (pendingPayment) {
        await prisma.payment.update({
          where: { id: pendingPayment.id },
          data: {
            total: totalItems
          }
        });
      }
    } catch (paymentError) {
      console.error('Error al actualizar el pago:', paymentError);
    }

    return NextResponse.json(consultationItem, { status: 201 });
  } catch (error) {
    console.error("Error adding consultation item:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE /api/consultations/[id]/items - Eliminar todos los items de una consulta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: consultationId } = await params;

    // Verificar que la consulta existe
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: "Consulta no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar todos los items de la consulta
    await prisma.transactionItem.deleteMany({
      where: {
        sourceType: 'consultation',
        sourceId: consultationId
      }
    });

    // Actualizar el pago si está pendiente
    try {
      const pendingPayment = await prisma.payment.findFirst({
        where: {
          consultationId: consultationId,
          status: 'pendiente'
        }
      });

      if (pendingPayment) {
        await prisma.payment.update({
          where: { id: pendingPayment.id },
          data: {
            total: 0
          }
        });
      }
    } catch (paymentError) {
      console.error('Error al actualizar el pago:', paymentError);
    }

    return NextResponse.json({ message: "Items eliminados correctamente" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting consultation items:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

