import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TagForSorting, SpecialtyForSorting } from "@/types/api";

// GET /api/prices - Listar todos los precios
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "medicamento" o "servicio"
    const tagName = searchParams.get("tag"); // nombre del tag
    const specialtyId = searchParams.get("specialtyId"); // ID de especialidad
    const isActive = searchParams.get("isActive"); // "true" o "false"
    const search = searchParams.get("search"); // búsqueda por nombre
    const limit = parseInt(searchParams.get("limit") || "100");

    // Construir filtros dinámicos
    const where: { type?: string, isActive?: boolean, name?: { contains: string }, serviceItemToTags?: { some: { tag: { name: string } } }, serviceItemToSpecialties?: { some: { specialty: { id: string } } } } = {};

    if (type) {
      where.type = type;
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === "true";
    }

    if (search) {
      where.name = {
        contains: search,
      };
    }

    if (tagName) {
      where.serviceItemToTags = {
        some: {
          tag: {
            name: tagName
          }
        }
      };
    }

    // Filtro por especialidad: DESHABILITADO por ahora
    // La tabla price_to_specialties puede estar vacía o no ser necesaria
    // Si en el futuro quieres filtrar por especialidad, descomenta esto:
    
    // if (specialtyId && specialtyId.trim() !== '') {
    //   where.OR = [
    //     // Opción 1: Precios sin especialidad específica (disponibles para todos)
    //     {
    //       specialties: {
    //         none: {}
    //       }
    //     },
    //     // Opción 2: Precios asociados a esta especialidad específica
    //     {
    //       specialties: {
    //         some: {
    //           specialtyId: specialtyId
    //         }
    //       }
    //     }
    //   ];
    // }

    const prices = await prisma.serviceItem.findMany({
      where,
      include: {
        variants: {
          where: {
            isActive: true
          },
          orderBy: {
            name: 'asc'
          }
        },
        serviceItemToTags: {
          include: {
            tag: true
          }
        },
        serviceItemToSpecialties: {
          include: {
            specialty: true
          }
        }
      } as never,
      orderBy: {
        name: 'asc'
      },
      take: limit
    });

    // Transformar la respuesta para facilitar el uso en el frontend
    const transformedPrices = prices.map(price => ({
      ...price,
      tags: (price as unknown as { serviceItemToTags: Array<{ tag: TagForSorting }> }).serviceItemToTags.map((pt) => pt.tag),
      specialties: (price as unknown as { serviceItemToSpecialties: Array<{ specialty: SpecialtyForSorting }> }).serviceItemToSpecialties.map((ps) => ps.specialty)
    }));

    // Ordenar con prioridad:
    // 1. Precios que coinciden con el tag buscado + especialidad del usuario
    // 2. Precios que coinciden con el tag buscado
    // 3. Precios con tag "especialidad" de la especialidad del usuario
    // 4. Otros precios con tag "especialidad"
    // 5. Resto de precios (orden alfabético)
    const sortedPrices = transformedPrices.sort((a, b) => {
      // Verificar si coincide con el tag filtrado
      const aMatchesTagFilter = tagName 
        ? a.tags.some((t: TagForSorting) => t.name.toLowerCase() === tagName.toLowerCase())
        : false;
      const bMatchesTagFilter = tagName 
        ? b.tags.some((t: TagForSorting) => t.name.toLowerCase() === tagName.toLowerCase())
        : false;

      // Verificar si tiene tag "especialidad"
      const aHasEspecialidadTag = a.tags.some((t: TagForSorting) => t.name.toLowerCase() === 'especialidad');
      const bHasEspecialidadTag = b.tags.some((t: TagForSorting) => t.name.toLowerCase() === 'especialidad');
      
      // Verificar si coincide con la especialidad del usuario
      const aMatchesUserSpecialty = specialtyId 
        ? a.specialties.some((s: SpecialtyForSorting) => s.id === specialtyId)
        : false;
      const bMatchesUserSpecialty = specialtyId 
        ? b.specialties.some((s: SpecialtyForSorting) => s.id === specialtyId)
        : false;

      // Prioridad 1: Coincide con tag filtrado + especialidad del usuario
      if (aMatchesTagFilter && aMatchesUserSpecialty && !(bMatchesTagFilter && bMatchesUserSpecialty)) {
        return -1;
      }
      if (bMatchesTagFilter && bMatchesUserSpecialty && !(aMatchesTagFilter && aMatchesUserSpecialty)) {
        return 1;
      }

      // Prioridad 2: Coincide con tag filtrado
      if (aMatchesTagFilter && !bMatchesTagFilter) {
        return -1;
      }
      if (bMatchesTagFilter && !aMatchesTagFilter) {
        return 1;
      }

      // Prioridad 3: Tag "especialidad" + especialidad del usuario
      if (aHasEspecialidadTag && aMatchesUserSpecialty && !(bHasEspecialidadTag && bMatchesUserSpecialty)) {
        return -1;
      }
      if (bHasEspecialidadTag && bMatchesUserSpecialty && !(aHasEspecialidadTag && aMatchesUserSpecialty)) {
        return 1;
      }

      // Prioridad 4: Tag "especialidad" (cualquier especialidad)
      if (aHasEspecialidadTag && !bHasEspecialidadTag) {
        return -1;
      }
      if (bHasEspecialidadTag && !aHasEspecialidadTag) {
        return 1;
      }

      // Prioridad 5: Orden alfabético
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      prices: sortedPrices,
      total: sortedPrices.length
    });
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json(
      { error: "Error al obtener los precios" },
      { status: 500 }
    );
  }
}

// POST /api/prices - Crear un nuevo precio
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role?.name !== "admin") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden crear precios." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, type, basePrice, tagIds, specialtyIds } = body;

    // Validaciones
    if (!name || !type || basePrice === undefined || basePrice === null) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: name, type, basePrice" },
        { status: 400 }
      );
    }

    if (!["medicamento", "servicio"].includes(type)) {
      return NextResponse.json(
        { error: "El tipo debe ser 'medicamento' o 'servicio'" },
        { status: 400 }
      );
    }

    if (typeof basePrice !== "number" || basePrice < 0) {
      return NextResponse.json(
        { error: "El precio base debe ser un número positivo" },
        { status: 400 }
      );
    }

    // Crear el item de servicio con sus relaciones
    const price = await prisma.serviceItem.create({
      data: {
        name,
        description: description || null,
        type,
        basePrice,
        isActive: true,
        // Crear relaciones con tags
        tags: tagIds && tagIds.length > 0 ? {
          create: tagIds.map((tagId: string) => ({
            tag: {
              connect: { id: tagId }
            }
          }))
        } : undefined,
        // Crear relaciones con especialidades (solo si se proporcionan)
        specialties: specialtyIds && specialtyIds.length > 0 ? {
          create: specialtyIds.map((specialtyId: string) => ({
            specialty: {
              connect: { id: specialtyId }
            }
          }))
        } : undefined
      },
      include: {
        variants: true,
        serviceItemToTags: {
          include: {
            tag: true
          }
        },
        serviceItemToSpecialties: {
          include: {
            specialty: true
          }
        }
      } as never
    });

    // Transformar respuesta
    const transformedPrice = {
      ...price,
      tags: (price as unknown as { serviceItemToTags: Array<{ tag: TagForSorting }> }).serviceItemToTags.map((pt) => pt.tag),
      specialties: (price as unknown as { serviceItemToSpecialties: Array<{ specialty: SpecialtyForSorting }> }).serviceItemToSpecialties.map((ps) => ps.specialty)
    };

    return NextResponse.json({ price: transformedPrice }, { status: 201 });
  } catch (error) {
    console.error("Error creating price:", error);
    return NextResponse.json(
      { error: "Error al crear el precio" },
      { status: 500 }
    );
  }
}

