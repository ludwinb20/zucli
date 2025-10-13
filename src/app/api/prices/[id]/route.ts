import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/prices/[id] - Obtener un precio específico
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

    const price = await prisma.serviceItem.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: {
            name: 'asc'
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        specialties: {
          include: {
            specialty: true
          }
        }
      }
    });

    if (!price) {
      return NextResponse.json(
        { error: "Precio no encontrado" },
        { status: 404 }
      );
    }

    // Transformar respuesta
    const transformedPrice = {
      ...price,
      tags: price.tags.map(pt => pt.tag),
      specialties: price.specialties.map(ps => ps.specialty)
    };

    return NextResponse.json({ price: transformedPrice });
  } catch (error) {
    console.error("Error fetching price:", error);
    return NextResponse.json(
      { error: "Error al obtener el precio" },
      { status: 500 }
    );
  }
}

// PUT /api/prices/[id] - Actualizar un precio
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role?.name !== "admin") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden actualizar precios." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, type, basePrice, isActive, tagIds, specialtyIds } = body;

    // Verificar que el item de servicio existe
    const existingPrice = await prisma.serviceItem.findUnique({
      where: { id },
      include: {
        tags: true,
        specialties: true
      }
    });

    if (!existingPrice) {
      return NextResponse.json(
        { error: "Precio no encontrado" },
        { status: 404 }
      );
    }

    // Validaciones
    if (type && !["medicamento", "servicio"].includes(type)) {
      return NextResponse.json(
        { error: "El tipo debe ser 'medicamento' o 'servicio'" },
        { status: 400 }
      );
    }

    if (basePrice !== undefined && (typeof basePrice !== "number" || basePrice < 0)) {
      return NextResponse.json(
        { error: "El precio base debe ser un número positivo" },
        { status: 400 }
      );
    }

    // Actualizar el precio usando una transacción
    const price = await prisma.$transaction(async (tx) => {
      // Si se proporcionan nuevos tagIds, actualizar la relación
      if (tagIds !== undefined) {
        // Eliminar tags existentes
        await tx.serviceItemToTag.deleteMany({
          where: { serviceItemId: id }
        });

        // Crear nuevos tags
        if (tagIds.length > 0) {
          await tx.serviceItemToTag.createMany({
            data: tagIds.map((tagId: string) => ({
              serviceItemId: id,
              tagId: tagId
            }))
          });
        }
      }

      // Si se proporcionan nuevos specialtyIds, actualizar la relación
      if (specialtyIds !== undefined) {
        // Eliminar especialidades existentes
        await tx.serviceItemToSpecialty.deleteMany({
          where: { serviceItemId: id }
        });

        // Crear nuevas especialidades
        if (specialtyIds.length > 0) {
          await tx.serviceItemToSpecialty.createMany({
            data: specialtyIds.map((specialtyId: string) => ({
              serviceItemId: id,
              specialtyId: specialtyId
            }))
          });
        }
      }

      // Actualizar el item de servicio
      return await tx.serviceItem.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(type !== undefined && { type }),
          ...(basePrice !== undefined && { basePrice }),
          ...(isActive !== undefined && { isActive })
        },
        include: {
          variants: true,
          tags: {
            include: {
              tag: true
            }
          },
          specialties: {
            include: {
              specialty: true
            }
          }
        }
      });
    });

    // Transformar respuesta
    const transformedPrice = {
      ...price,
      tags: price.tags.map(pt => pt.tag),
      specialties: price.specialties.map(ps => ps.specialty)
    };

    return NextResponse.json({ price: transformedPrice });
  } catch (error) {
    console.error("Error updating price:", error);
    return NextResponse.json(
      { error: "Error al actualizar el precio" },
      { status: 500 }
    );
  }
}

// DELETE /api/prices/[id] - Eliminar un precio
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role?.name !== "admin") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden eliminar precios." },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verificar que el item de servicio existe
    const existingPrice = await prisma.serviceItem.findUnique({
      where: { id }
    });

    if (!existingPrice) {
      return NextResponse.json(
        { error: "Item de servicio no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el item de servicio (las relaciones se eliminan en cascada)
    await prisma.serviceItem.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: "Precio eliminado exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting price:", error);
    return NextResponse.json(
      { error: "Error al eliminar el precio" },
      { status: 500 }
    );
  }
}

