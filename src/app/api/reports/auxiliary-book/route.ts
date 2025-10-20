import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/reports/auxiliary-book - Libro Auxiliar (totales diarios de facturas legales)
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

    // Obtener facturas legales en el rango de fechas
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
        fechaEmision: true,
        total: true
      },
      orderBy: {
        fechaEmision: 'asc'
      }
    });

    // Agrupar por día
    const dailyTotalsMap = new Map<string, { invoiceCount: number; total: number }>();
    
    invoices.forEach(invoice => {
      const dateKey = new Date(invoice.fechaEmision).toISOString().split('T')[0];
      
      if (!dailyTotalsMap.has(dateKey)) {
        dailyTotalsMap.set(dateKey, { invoiceCount: 0, total: 0 });
      }
      
      const current = dailyTotalsMap.get(dateKey)!;
      dailyTotalsMap.set(dateKey, {
        invoiceCount: current.invoiceCount + 1,
        total: current.total + invoice.total
      });
    });

    // Convertir a array y asegurar que incluya todos los días del rango
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dailyTotals = [];
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateKey = date.toISOString().split('T')[0];
      const data = dailyTotalsMap.get(dateKey) || { invoiceCount: 0, total: 0 };
      
      dailyTotals.push({
        date: dateKey,
        invoiceCount: data.invoiceCount,
        total: data.total
      });
    }

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);

    return NextResponse.json({
      dailyTotals,
      totalInvoices: invoices.length,
      totalAmount
    });

  } catch (error) {
    console.error('Error al generar libro auxiliar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

