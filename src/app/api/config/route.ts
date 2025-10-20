import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionUser, getUserRoleName } from '@/types/api';

// GET /api/config - Obtener configuración
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      const config = await prisma.systemConfig.findUnique({
        where: { key },
      });

      if (!config) {
        return NextResponse.json(
          { error: 'Configuración no encontrada' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ...config,
        value: JSON.parse(config.value),
      });
    }

    const configs = await prisma.systemConfig.findMany();
    
    return NextResponse.json(
      configs.map(c => ({
        ...c,
        value: JSON.parse(c.value),
      }))
    );
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

// POST /api/config - Crear o actualizar configuración
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = getUserRoleName(session.user as SessionUser);
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'La clave es requerida' },
        { status: 400 }
      );
    }

    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: {
        value: JSON.stringify(value),
      },
      create: {
        key,
        value: JSON.stringify(value),
      },
    });

    return NextResponse.json({
      ...config,
      value: JSON.parse(config.value),
    });
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    return NextResponse.json(
      { error: 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}

