import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/variants/[id] - Obtener una variante específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const variant = await prisma.serviceItemVariant.findUnique({
      where: { id },
      include: {
        serviceItem: true
      }
    });

    if (!variant) {
      return NextResponse.json(
        { error: "Variante no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ variant });
  } catch (error) {
    console.error("Error fetching variant:", error);
    return NextResponse.json(
      { error: "Error al obtener la variante" },
      { status: 500 }
    );
  }
}

// PUT /api/variants/[id] - Actualizar una variante
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role?.name !== "admin") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden actualizar variantes." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, price, isActive } = body;

    // Verificar que la variante existe
    const existingVariant = await prisma.serviceItemVariant.findUnique({
      where: { id }
    });

    if (!existingVariant) {
      return NextResponse.json(
        { error: "Variante no encontrada" },
        { status: 404 }
      );
    }

    // Validaciones
    if (price !== undefined && (typeof price !== "number" || price < 0)) {
      return NextResponse.json(
        { error: "El precio debe ser un número positivo" },
        { status: 400 }
      );
    }

    // Actualizar la variante
    const variant = await prisma.serviceItemVariant.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        serviceItem: true
      }
    });

    return NextResponse.json({ variant });
  } catch (error) {
    console.error("Error updating variant:", error);
    return NextResponse.json(
      { error: "Error al actualizar la variante" },
      { status: 500 }
    );
  }
}

// DELETE /api/variants/[id] - Eliminar una variante
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role?.name !== "admin") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden eliminar variantes." },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verificar que la variante existe
    const existingVariant = await prisma.serviceItemVariant.findUnique({
      where: { id }
    });

    if (!existingVariant) {
      return NextResponse.json(
        { error: "Variante no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar la variante
    await prisma.serviceItemVariant.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: "Variante eliminada exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting variant:", error);
    return NextResponse.json(
      { error: "Error al eliminar la variante" },
      { status: 500 }
    );
  }
}

