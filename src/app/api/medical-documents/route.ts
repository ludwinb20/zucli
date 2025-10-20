import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateMedicalDocumentData } from '@/types/medical-documents';

// GET /api/medical-documents - Obtener documentos médicos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const documentType = searchParams.get('documentType');

    const where: {
      patientId?: string;
      documentType?: string;
    } = {};
    
    if (patientId) {
      where.patientId = patientId;
    }
    
    if (documentType) {
      where.documentType = documentType;
    }

    const documents = await prisma.medicalDocument.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      documents,
      total: documents.length,
    });
  } catch (error) {
    console.error('Error fetching medical documents:', error);
    return NextResponse.json(
      { error: 'Error al obtener documentos médicos' },
      { status: 500 }
    );
  }
}

// POST /api/medical-documents - Crear nuevo documento médico
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario sea doctor/especialista
    const userRole = session.user.role?.name;
    const isDoctor = userRole === 'especialista' || userRole === 'admin';
    
    if (!isDoctor) {
      return NextResponse.json(
        { error: 'Solo los médicos pueden emitir documentos médicos' },
        { status: 403 }
      );
    }

    const body: CreateMedicalDocumentData = await request.json();
    const { patientId, documentType } = body;

    // Validar campos requeridos
    if (!patientId || !documentType) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    // Verificar que el paciente existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    const documentData: {
      patientId: string;
      issuedBy: string;
      documentType: string;
      constancia?: string;
      diagnostico?: string;
      diasReposo?: number;
      fechaInicio?: Date;
      fechaFin?: Date;
      tipoExamen?: string;
      indicaciones?: string;
      urgencia?: string;
    } = {
      patientId,
      issuedBy: session.user.id,
      documentType,
    };

    // Validar y agregar campos específicos según el tipo
    if (documentType === 'constancia') {
      const { constancia } = body as { constancia?: string };
      if (!constancia || constancia.trim() === '') {
        return NextResponse.json(
          { error: 'El contenido de la constancia es requerido' },
          { status: 400 }
        );
      }
      documentData.constancia = constancia;
    } else if (documentType === 'incapacidad') {
      const { diagnostico, diasReposo, fechaInicio } = body as { 
        diagnostico?: string;
        diasReposo?: number;
        fechaInicio?: string;
      };
      
      if (!diagnostico || !diasReposo || !fechaInicio) {
        return NextResponse.json(
          { error: 'Diagnóstico, días de reposo y fecha de inicio son requeridos' },
          { status: 400 }
        );
      }

      if (diasReposo < 1 || diasReposo > 365) {
        return NextResponse.json(
          { error: 'Los días de reposo deben estar entre 1 y 365' },
          { status: 400 }
        );
      }

      // Calcular fecha fin
      const startDate = new Date(fechaInicio);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + diasReposo);

      documentData.diagnostico = diagnostico;
      documentData.diasReposo = diasReposo;
      documentData.fechaInicio = startDate;
      documentData.fechaFin = endDate;
    } else if (documentType === 'orden_examen') {
      const { tipoExamen, indicaciones, urgencia } = body as {
        tipoExamen?: string;
        indicaciones?: string;
        urgencia?: string;
      };
      
      if (!tipoExamen || !indicaciones || !urgencia) {
        return NextResponse.json(
          { error: 'Tipo de examen, indicaciones y urgencia son requeridos' },
          { status: 400 }
        );
      }

      if (!['normal', 'urgente'].includes(urgencia)) {
        return NextResponse.json(
          { error: 'Urgencia debe ser "normal" o "urgente"' },
          { status: 400 }
        );
      }

      documentData.tipoExamen = tipoExamen;
      documentData.indicaciones = indicaciones;
      documentData.urgencia = urgencia;
    } else {
      return NextResponse.json(
        { error: 'Tipo de documento inválido' },
        { status: 400 }
      );
    }

    // Crear el documento
    const document = await prisma.medicalDocument.create({
      data: documentData,
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

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Error creating medical document:', error);
    return NextResponse.json(
      { error: 'Error al crear documento médico' },
      { status: 500 }
    );
  }
}

