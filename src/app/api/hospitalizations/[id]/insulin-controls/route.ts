import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/hospitalizations/[id]/insulin-controls - Listar controles de insulina
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await context.params;

    const insulinControls = await prisma.insulinControl.findMany({
      where: { hospitalizationId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(insulinControls);
  } catch (error) {
    console.error("Error al obtener controles de insulina:", error);
    return NextResponse.json(
      { error: "Error al obtener controles de insulina" },
      { status: 500 }
    );
  }
}

// POST /api/hospitalizations/[id]/insulin-controls - Crear control de insulina
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { resultado, insulinaAdministrada } = body;

    // Validar que la hospitalización existe y está activa
    const hospitalization = await prisma.hospitalization.findUnique({
      where: { id },
    });

    if (!hospitalization) {
      return NextResponse.json(
        { error: "Hospitalización no encontrada" },
        { status: 404 }
      );
    }

    if (hospitalization.status !== "iniciada") {
      return NextResponse.json(
        { error: "Solo se pueden registrar controles en hospitalizaciones activas" },
        { status: 400 }
      );
    }

    // Crear control de insulina (convertir tipos)
    const insulinControl = await prisma.insulinControl.create({
      data: {
        hospitalizationId: id,
        resultado: resultado ? parseFloat(resultado) : 0,
        insulinaAdministrada: insulinaAdministrada ? parseFloat(insulinaAdministrada) : 0,
      },
    });

    return NextResponse.json(insulinControl, { status: 201 });
  } catch (error) {
    console.error("Error al crear control de insulina:", error);
    return NextResponse.json(
      { error: "Error al crear control de insulina" },
      { status: 500 }
    );
  }
}

