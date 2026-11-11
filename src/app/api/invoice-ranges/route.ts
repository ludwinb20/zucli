import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatPuntoEmision } from "@/lib/formatters";

export async function GET() {
  try {
    const invoiceRanges = await prisma.invoiceRange.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      invoiceRanges.map((range) => ({
        ...range,
        puntoEmision: formatPuntoEmision(range.puntoEmision),
      }))
    );
  } catch (error) {
    console.error("Error fetching invoice ranges:", error);
    return NextResponse.json(
      { error: "Error al obtener los rangos de facturación" },
      { status: 500 }
    );
  }
}

