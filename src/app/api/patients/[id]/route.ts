import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
// Removemos las importaciones que ya no necesitamos

// GET - Obtener paciente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const patient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    // Formatear la respuesta para consistencia
    const formattedPatient = {
      ...patient,
      birthDate: patient.birthDate instanceof Date 
        ? patient.birthDate.toISOString().split('T')[0]
        : new Date(patient.birthDate).toISOString().split('T')[0],
      createdAt: patient.createdAt instanceof Date 
        ? patient.createdAt.toISOString()
        : new Date(patient.createdAt).toISOString(),
      updatedAt: patient.updatedAt instanceof Date
        ? patient.updatedAt.toISOString() 
        : new Date(patient.updatedAt).toISOString(),
    };

    return NextResponse.json(formattedPatient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar paciente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, birthDate, gender, identityNumber, phone, address, emergencyContactName, emergencyContactNumber, emergencyContactRelation, medicalHistory, allergies } = body;

    // Verificar que el paciente existe
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el número de identidad no existe en otro paciente
    if (identityNumber && identityNumber !== existingPatient.identityNumber) {
      const patientWithIdentity = await prisma.patient.findFirst({
        where: { 
          identityNumber,
          id: { not: id }
        },
      });

      if (patientWithIdentity) {
        return NextResponse.json(
          { error: 'El número de identidad ya está registrado en otro paciente' },
          { status: 400 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: { firstName?: string, lastName?: string, gender?: string, identityNumber?: string, phone?: string, address?: string, emergencyContactName?: string, emergencyContactNumber?: string, emergencyContactRelation?: string, medicalHistory?: string, allergies?: string, birthDate?: Date } = {
      ...(firstName && { firstName: firstName.trim() }),
      ...(lastName && { lastName: lastName.trim() }),
      ...(gender && { gender }),
      ...(identityNumber && { identityNumber: identityNumber.trim() }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(address !== undefined && { address: address?.trim() || null }),
      ...(emergencyContactName !== undefined && { emergencyContactName: emergencyContactName?.trim() || null }),
      ...(emergencyContactNumber !== undefined && { emergencyContactNumber: emergencyContactNumber?.trim() || null }),
      ...(emergencyContactRelation !== undefined && { emergencyContactRelation: emergencyContactRelation?.trim() || null }),
      ...(medicalHistory !== undefined && { medicalHistory: medicalHistory?.trim() || null }),
      ...(allergies !== undefined && { allergies: allergies?.trim() || null }),
    };

    // Convertir fecha de nacimiento si se proporciona
    if (birthDate) {
      updateData.birthDate = new Date(birthDate + 'T00:00:00');
    }

    // Actualizar el paciente
    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: updateData,
    });

    // Formatear la respuesta para consistencia
    const formattedPatient = {
      ...updatedPatient,
      birthDate: updatedPatient.birthDate instanceof Date 
        ? updatedPatient.birthDate.toISOString().split('T')[0]
        : new Date(updatedPatient.birthDate).toISOString().split('T')[0],
      createdAt: updatedPatient.createdAt instanceof Date 
        ? updatedPatient.createdAt.toISOString()
        : new Date(updatedPatient.createdAt).toISOString(),
      updatedAt: updatedPatient.updatedAt instanceof Date
        ? updatedPatient.updatedAt.toISOString() 
        : new Date(updatedPatient.updatedAt).toISOString(),
    };

    return NextResponse.json(formattedPatient);
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar paciente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificar que el paciente existe
    const existingPatient = await prisma.patient.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el paciente
    await prisma.patient.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Paciente eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
