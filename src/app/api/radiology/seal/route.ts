import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readFile } from 'fs/promises';
import { join } from 'path';

// GET /api/radiology/seal - Obtener imagen del sello (solo radiólogos y admins)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Solo radiólogos y admins pueden acceder al sello
    if (!session?.user || !['radiologo', 'admin'].includes(session.user.role?.name || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Leer el archivo del sello desde src/assets
    const filePath = join(process.cwd(), 'src', 'assets', 'sello.png');
    const imageBuffer = await readFile(filePath);

    // Devolver la imagen con el tipo MIME correcto
    // Convertir Buffer a Uint8Array para compatibilidad con NextResponse
    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'private, max-age=3600', // Cache por 1 hora
      },
    });
  } catch (error) {
    console.error('Error al servir imagen del sello:', error);
    return NextResponse.json(
      { error: 'Error al obtener la imagen del sello' },
      { status: 500 }
    );
  }
}

