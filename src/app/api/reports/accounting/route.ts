import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/reports/accounting - Reporte Contable (solo facturas legales)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!["admin"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para acceder a reportes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Se requieren fechas de inicio y fin' },
        { status: 400 }
      );
    }

    // Obtener solo facturas legales en el rango de fechas
    const invoices = await prisma.invoice.findMany({
      where: {
        type: 'legal',
        fechaEmision: {
          gte: new Date(startDate),
          lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
        }
      },
      select: {
        id: true,
        numeroDocumento: true,
        fechaEmision: true,
        clienteNombre: true,
        clienteIdentidad: true,
        total: true
      },
      orderBy: {
        fechaEmision: 'asc'
      }
    });

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);

    return NextResponse.json({
      invoices,
      totalAmount,
      totalCount: invoices.length
    });

  } catch (error) {
    console.error('Error al generar reporte contable:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

