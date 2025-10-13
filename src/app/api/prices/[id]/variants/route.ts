import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/prices/[id]/variants - Listar variantes de un precio
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

    // Verificar que el item de servicio existe
    const price = await prisma.serviceItem.findUnique({
      where: { id }
    });

    if (!price) {
      return NextResponse.json(
        { error: "Item de servicio no encontrado" },
        { status: 404 }
      );
    }

    const variants = await prisma.serviceItemVariant.findMany({
      where: { serviceItemId: id },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      variants,
      total: variants.length
    });
  } catch (error) {
    console.error("Error fetching variants:", error);
    return NextResponse.json(
      { error: "Error al obtener las variantes" },
      { status: 500 }
    );
  }
}

// POST /api/prices/[id]/variants - Crear una nueva variante
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role?.name !== "admin") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden crear variantes." },
        { status: 403 }
      );
    }

    const { id: priceId } = await params;
    const body = await request.json();
    const { name, description, price } = body;

    // Validaciones
    if (!name || price === undefined || price === null) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: name, price" },
        { status: 400 }
      );
    }

    if (typeof price !== "number" || price < 0) {
      return NextResponse.json(
        { error: "El precio debe ser un número positivo" },
        { status: 400 }
      );
    }

    // Verificar que el item de servicio existe
    const existingPrice = await prisma.serviceItem.findUnique({
      where: { id: priceId }
    });

    if (!existingPrice) {
      return NextResponse.json(
        { error: "Item de servicio no encontrado" },
        { status: 404 }
      );
    }

    // Crear la variante
    const variant = await prisma.serviceItemVariant.create({
      data: {
        serviceItemId: priceId,
        name,
        description: description || null,
        price,
        isActive: true
      }
    });

    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    console.error("Error creating variant:", error);
    return NextResponse.json(
      { error: "Error al crear la variante" },
      { status: 500 }
    );
  }
}

