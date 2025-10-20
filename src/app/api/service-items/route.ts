import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/service-items - Obtener items de servicio
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeVariants = searchParams.get('includeVariants') === 'true';
    const type = searchParams.get('type'); // 'medicamento' o 'servicio'
    const isActive = searchParams.get('isActive') !== 'false';

    // Construir el where clause
    const where: {
      isActive: boolean;
      type?: string;
      tags?: { some: { tagId: string } };
      name?: { contains: string; mode: 'insensitive' };
    } = {
      isActive,
    };

    if (type) {
      where.type = type;
    }

    // Obtener items de servicio
    const serviceItems = await prisma.serviceItem.findMany({
      where,
      include: {
        variants: includeVariants ? {
          where: {
            isActive: true,
          },
          orderBy: {
            name: 'asc',
          },
        } : false,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(serviceItems);

  } catch (error) {
    console.error('Error al obtener items de servicio:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

