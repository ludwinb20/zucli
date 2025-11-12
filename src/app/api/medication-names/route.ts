import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const allowedRoles = ['admin', 'recepcion'];

function hasPermission(session: Awaited<ReturnType<typeof getServerSession<typeof authOptions>> | null>) {
  const roleName = session?.user?.role?.name;
  return roleName ? allowedRoles.includes(roleName) : false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();

    const medications = await prisma.medicationName.findMany({
        where: search
          ? {
            name: {
              contains: search,
            },
          }
          : undefined,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ medications });
  } catch (error) {
    console.error('Error fetching medication names:', error);
    return NextResponse.json(
      { error: 'Error al obtener los nombres de medicamentos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasPermission(session)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const rawName = typeof body.name === 'string' ? body.name.trim() : '';

    if (!rawName) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }

    const existing = await prisma.medicationName.findFirst({
      where: {
        name: {
          equals: rawName,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ya existe un medicamento con ese nombre' }, { status: 409 });
    }

    const medication = await prisma.medicationName.create({
      data: {
        name: rawName,
      },
    });

    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    console.error('Error creating medication name:', error);
    return NextResponse.json(
      { error: 'Error al crear el nombre de medicamento' },
      { status: 500 }
    );
  }
}
