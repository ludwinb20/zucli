import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/tags - Listar todos los tags
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log(request)
    if (!session?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const tags = await prisma.tag.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Error al obtener los tags" },
      { status: 500 }
    );
  }
}

// POST /api/tags - Crear un nuevo tag (solo admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role?.name !== "admin") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden crear tags." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description } = body;

    // Validaciones
    if (!name) {
      return NextResponse.json(
        { error: "El nombre del tag es requerido" },
        { status: 400 }
      );
    }

    // Verificar que no exista un tag con el mismo nombre
    const existingTag = await prisma.tag.findUnique({
      where: { name }
    });

    if (existingTag) {
      return NextResponse.json(
        { error: "Ya existe un tag con ese nombre" },
        { status: 409 }
      );
    }

    // Crear el tag
    const tag = await prisma.tag.create({
      data: {
        name,
        description: description || null
      }
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Error al crear el tag" },
      { status: 500 }
    );
  }
}

