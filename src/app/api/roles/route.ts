import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Obtener todos los roles (solo admin)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role?.name || session.user.role.name !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta información' },
        { status: 403 }
      );
    }

    const roles = await prisma.role.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
