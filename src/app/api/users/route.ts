import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - Obtener usuarios (admin: todos, recepcion/admin: filtrar por rol)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roleName = searchParams.get('role');

    // Si hay filtro por rol, permitir a recepcion y admin
    // Si no hay filtro, solo permitir a admin
    if (!roleName && session.user.role?.name !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta información' },
        { status: 403 }
      );
    }

    // Construir filtros
    const where: { isActive?: boolean; role?: { name: string } } = {
      isActive: true,
    };

    if (roleName) {
      where.role = { name: roleName };
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        role: true,
        specialty: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });

    // No incluir las contraseñas en la respuesta
    const usersWithoutPassword = users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    // Si hay filtro por rol, devolver con formato { users: [...] }
    if (roleName) {
      return NextResponse.json({ users: usersWithoutPassword });
    }

    return NextResponse.json(usersWithoutPassword);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo usuario (solo admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role?.name || session.user.role.name !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear usuarios' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log(body);
    const { username, password, name, roleId, specialtyId, isActive = true } = body;

    // Validaciones básicas
    if (!username || !password || !name || !roleId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: username, password, name, roleId' },
        { status: 400 }
      );
    }

    // Verificar que el rol existe
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'El rol especificado no existe' },
        { status: 400 }
      );
    }

    // Verificar que el username no existe
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya existe' },
        { status: 400 }
      );
    }


    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12);

    // Crear el usuario
    const newUser = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          name,
          roleId,
          specialtyId: specialtyId || null,
          isActive,
        },
      include: {
        role: true,
        specialty: {
          select: {
            id: true,
            name: true
          }
        }
      },
    });

    // No incluir la contraseña en la respuesta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = newUser;

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
