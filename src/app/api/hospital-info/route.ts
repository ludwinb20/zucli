import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/hospital-info - Obtener información del hospital desde InvoiceRange activo
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener el invoice range activo
    const activeRange = await prisma.invoiceRange.findFirst({
      where: {
        estado: 'activo'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!activeRange) {
      return NextResponse.json({
        nombreComercial: 'Hospital/Clínica',
        razonSocial: 'Sin información',
        rtn: 'N/A'
      });
    }

    return NextResponse.json({
      nombreComercial: activeRange.nombreComercial,
      razonSocial: activeRange.razonSocial,
      rtn: activeRange.rtn
    });

  } catch (error) {
    console.error('Error fetching hospital info:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

