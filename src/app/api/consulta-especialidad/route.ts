import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener todas las configuraciones de consulta por especialidad
export async function GET() {
  try {
    const consultaEspecialidades = await prisma.consultaEspecialidad.findMany({
      include: {
        specialty: true,
        serviceItem: {
          include: {
            variants: true,
          },
        },
        variant: true,
      },
      orderBy: {
        specialty: {
          name: "asc",
        },
      },
    });

    return NextResponse.json(consultaEspecialidades);
  } catch (error) {
    console.error("Error fetching consulta especialidades:", error);
    return NextResponse.json(
      { error: "Error al obtener las configuraciones de consulta" },
      { status: 500 }
    );
  }
}

// POST - Crear o actualizar configuración de consulta por especialidad
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { specialtyId, priceId, variantId } = body;

    if (!specialtyId || !priceId) {
      return NextResponse.json(
        { error: "specialtyId y serviceItemId son requeridos" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una configuración para esta especialidad
    const existing = await prisma.consultaEspecialidad.findUnique({
      where: { specialtyId },
    });

    let consultaEspecialidad;

    if (existing) {
      // Actualizar
      consultaEspecialidad = await prisma.consultaEspecialidad.update({
        where: { specialtyId },
        data: {
          serviceItemId: priceId,
          variantId: variantId || null,
        },
        include: {
          specialty: true,
          serviceItem: {
            include: {
              variants: true,
            },
          },
          variant: true,
        },
      });
    } else {
      // Crear
      consultaEspecialidad = await prisma.consultaEspecialidad.create({
        data: {
          specialtyId,
          serviceItemId: priceId,
          variantId: variantId || null,
        },
        include: {
          specialty: true,
          serviceItem: {
            include: {
              variants: true,
            },
          },
          variant: true,
        },
      });
    }

    return NextResponse.json(consultaEspecialidad);
  } catch (error) {
    console.error("Error creating/updating consulta especialidad:", error);
    return NextResponse.json(
      { error: "Error al guardar la configuración de consulta" },
      { status: 500 }
    );
  }
}

