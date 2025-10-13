import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE - Eliminar configuración de consulta por especialidad
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.consultaEspecialidad.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting consulta especialidad:", error);
    return NextResponse.json(
      { error: "Error al eliminar la configuración de consulta" },
      { status: 500 }
    );
  }
}

