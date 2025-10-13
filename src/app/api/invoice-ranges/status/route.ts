import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/invoice-ranges/status - Verificar estado del rango de facturación activo
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar rango activo
    const activeRange = await prisma.invoiceRange.findFirst({
      where: {
        estado: 'activo',
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!activeRange) {
      return NextResponse.json({
        hasActiveRange: false,
        warnings: ['No hay un rango de facturación activo configurado'],
      });
    }

    const warnings: string[] = [];
    const now = new Date();
    const fechaLimite = new Date(activeRange.fechaLimiteEmision);
    
    // Calcular días restantes hasta fecha límite
    const diffTime = fechaLimite.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calcular correlativos disponibles
    const correlativosDisponibles = activeRange.rangoFin - activeRange.correlativoActual;

    // Chequeo 1: Fecha límite menor a 15 días
    if (daysRemaining < 15) {
      if (daysRemaining < 0) {
        warnings.push(`El rango de facturación CAI ${activeRange.cai} ha vencido`);
      } else {
        warnings.push(`El rango de facturación vence en ${daysRemaining} días (${fechaLimite.toLocaleDateString('es-HN')})`);
      }
    }

    // Chequeo 2: Menos de 50 correlativos disponibles
    if (correlativosDisponibles < 50) {
      warnings.push(`Solo quedan ${correlativosDisponibles} facturas disponibles en el rango actual`);
    }

    return NextResponse.json({
      hasActiveRange: true,
      warnings,
      rangeInfo: {
        cai: activeRange.cai,
        correlativoActual: activeRange.correlativoActual,
        rangoFin: activeRange.rangoFin,
        correlativosDisponibles,
        fechaLimiteEmision: activeRange.fechaLimiteEmision,
        daysRemaining,
      }
    });

  } catch (error) {
    console.error('Error checking invoice range status:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

