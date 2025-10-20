import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/medical-documents/[id] - Obtener documento específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.medicalDocument.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            identityNumber: true,
            birthDate: true,
            gender: true,
          },
        },
        issuer: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error fetching medical document:', error);
    return NextResponse.json(
      { error: 'Error al obtener documento médico' },
      { status: 500 }
    );
  }
}

// DELETE /api/medical-documents/[id] - Eliminar documento (solo admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admin puede eliminar documentos
    if (session.user.role?.name !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar documentos médicos' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const document = await prisma.medicalDocument.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    await prisma.medicalDocument.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Documento eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting medical document:', error);
    return NextResponse.json(
      { error: 'Error al eliminar documento médico' },
      { status: 500 }
    );
  }
}

