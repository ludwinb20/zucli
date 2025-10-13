import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Patient } from '@/types/patients';

// GET - Obtener pacientes con paginación y búsqueda
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';

    // Calcular offset para paginación
    const skip = (page - 1) * limit;
    
    console.log('API Request:', { page, limit, search, skip });

    // Usar consulta SQL nativa para MySQL (compatible con case-insensitive search)
    let whereClause = '';
    let params: string[] = [];
    
    if (search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      const searchTermNoHyphens = searchTerm.replace(/-/g, '');
      
      whereClause = `
        WHERE
          LOWER(firstName) LIKE ? OR
          LOWER(lastName) LIKE ? OR
          LOWER(CONCAT(firstName, ' ', lastName)) LIKE ? OR
          LOWER(CONCAT(lastName, ' ', firstName)) LIKE ? OR
          identityNumber LIKE ? OR
          identityNumber LIKE ?
      `;
      params = [
        `%${searchTerm}%`,
        `%${searchTerm}%`, 
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTermNoHyphens}%`
      ];
      
      // Debug: mostrar la query generada
      console.log('BuildSearchQuery:', {
        searchTerm,
        whereClause,
        paramCount: params.length
      });
    }

    console.log('Executing query:', {
      query: `SELECT * FROM patients ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      params: [...(whereClause ? params : []), limit, skip]
    });

    let patientsRaw: Patient[];
    let countRaw: { count: string }[];

    try {
      patientsRaw = await prisma.$queryRawUnsafe(
        `SELECT * FROM patients ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
        ...(whereClause ? params : []),
        limit,
        skip
      ) as Patient[];

      console.log('Count query:', {
        query: `SELECT COUNT(*) as count FROM patients ${whereClause}`,
        params: whereClause ? params : []
      });

      countRaw = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM patients ${whereClause}`,
        ...(whereClause ? params : [])
      ) as { count: string }[];
    } catch (queryError) {
      console.error('SQL Query Error:', queryError);
      console.error('Query details:', {
        whereClause,
        params,
        limit,
        skip
      });
      throw new Error(`Database query failed: ${queryError}`);
    }

    // Convertir resultados al formato esperado
    const patients = patientsRaw.map(patient => ({
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      birthDate: new Date(patient.birthDate).toISOString().split('T')[0],
      gender: patient.gender,
      identityNumber: patient.identityNumber,
      phone: patient.phone,
      address: patient.address,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactNumber: patient.emergencyContactNumber,
      emergencyContactRelation: patient.emergencyContactRelation,
      medicalHistory: patient.medicalHistory,
      allergies: patient.allergies,
      createdAt: new Date(patient.createdAt).toISOString(),
      updatedAt: new Date(patient.updatedAt).toISOString(),
    }));

    const totalCount = Number(countRaw[0].count);
    
    // Calcular información de paginación
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      patients,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPreviousPage,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo paciente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

        const body = await request.json();
        const { firstName, lastName, birthDate, gender, identityNumber, phone, address, emergencyContactName, emergencyContactNumber, emergencyContactRelation, medicalHistory, allergies } = body;

    // Validaciones básicas
    if (!firstName || !lastName || !birthDate || !gender || !identityNumber) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: firstName, lastName, birthDate, gender, identityNumber' },
        { status: 400 }
      );
    }

    // Verificar que el número de identidad no existe
    const existingPatient = await prisma.patient.findUnique({
      where: { 
        identityNumber: identityNumber 
      },
    });

    if (existingPatient) {
      return NextResponse.json(
        { error: 'El número de identidad ya está registrado' },
        { status: 400 }
      );
    }

        const newPatient = await prisma.patient.create({
          data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            birthDate: new Date(birthDate + 'T00:00:00'), // Fecha en medianoche local
            gender,
            identityNumber: identityNumber.trim(),
            phone: phone?.trim() || null,
            address: address?.trim() || null,
            emergencyContactName: emergencyContactName?.trim() || null,
            emergencyContactNumber: emergencyContactNumber?.trim() || null,
            emergencyContactRelation: emergencyContactRelation?.trim() || null,
            medicalHistory: medicalHistory?.trim() || null,
            allergies: allergies?.trim() || null,
          },
        });

        // Formatear la respuesta para que sea consistente con GET
        const formattedPatient = {
          ...newPatient,
          birthDate: newPatient.birthDate.toISOString().split('T')[0],
          createdAt: newPatient.createdAt.toISOString(),
          updatedAt: newPatient.updatedAt.toISOString(),
        };

    return NextResponse.json(formattedPatient, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
