import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/hospitalizations/[id]/intake-output - Listar controles de ingestas y excretas
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

    const controls = await prisma.intakeOutputControl.findMany({
      where: { hospitalizationId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(controls);
  } catch (error) {
    console.error("Error al obtener controles de ingestas y excretas:", error);
    return NextResponse.json(
      { error: "Error al obtener controles de ingestas y excretas" },
      { status: 500 }
    );
  }
}

// POST /api/hospitalizations/[id]/intake-output - Crear control de ingesta o excreta
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
    const { type, ingestaType, cantidad, excretaType } = body;
    const excretaCantidad = body.excretaCantidad;

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

    // Validar según el tipo
    if (type === "ingesta") {
      if (!ingestaType || cantidad === undefined || cantidad === null) {
        return NextResponse.json(
          { error: "Para ingestas, se requiere tipo y cantidad" },
          { status: 400 }
        );
      }
    } else if (type === "excreta") {
      if (!excretaType) {
        return NextResponse.json(
          { error: "Para excretas, se requiere el tipo" },
          { status: 400 }
        );
      }

      if ((excretaType === "orina" || excretaType === "drenaje") && (excretaCantidad === undefined || excretaCantidad === null)) {
        return NextResponse.json(
          { error: "Debe especificar la cantidad en ml para orina o drenaje" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Tipo inválido. Debe ser 'ingesta' o 'excreta'" },
        { status: 400 }
      );
    }

    // Crear control
    const control = await prisma.intakeOutputControl.create({
      data: {
        hospitalizationId: id,
        type,
        ingestaType: type === "ingesta" ? ingestaType : null,
        cantidad: type === "ingesta" && cantidad ? parseFloat(cantidad) : null,
        excretaType: type === "excreta" ? excretaType : null,
        excretaCantidad:
          type === "excreta" && (excretaType === "orina" || excretaType === "drenaje") && excretaCantidad !== undefined
            ? parseFloat(excretaCantidad)
            : null,
      },
    });

    return NextResponse.json(control, { status: 201 });
  } catch (error) {
    console.error("Error al crear control de ingesta/excreta:", error);
    return NextResponse.json(
      { error: "Error al crear control de ingesta/excreta" },
      { status: 500 }
    );
  }
}

