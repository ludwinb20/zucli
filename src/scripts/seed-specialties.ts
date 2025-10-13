import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const specialties = [
  {
    name: 'Medicina General',
    description: 'Atención médica integral para adultos y niños'
  },
  {
    name: 'Cardiología',
    description: 'Especialidad médica que se ocupa del diagnóstico y tratamiento de las enfermedades del corazón'
  },
  {
    name: 'Pediatría',
    description: 'Especialidad médica que estudia al niño y sus enfermedades'
  },
  {
    name: 'Ginecología',
    description: 'Especialidad médica que se ocupa de la salud del aparato reproductor femenino'
  },
  {
    name: 'Traumatología',
    description: 'Especialidad médica que se dedica al diagnóstico y tratamiento de las lesiones del aparato locomotor'
  },
  {
    name: 'Dermatología',
    description: 'Especialidad médica que se encarga del estudio de la estructura y función de la piel'
  },
  {
    name: 'Oftalmología',
    description: 'Especialidad médica que estudia las enfermedades de los ojos'
  },
  {
    name: 'Otorrinolaringología',
    description: 'Especialidad médica que se encarga del estudio de las enfermedades del oído, nariz y garganta'
  },
  {
    name: 'Neurología',
    description: 'Especialidad médica que estudia la estructura, función y desarrollo del sistema nervioso'
  },
  {
    name: 'Psiquiatría',
    description: 'Especialidad médica dedicada al estudio, prevención, diagnóstico y tratamiento de los trastornos mentales'
  },
  {
    name: 'Endocrinología',
    description: 'Especialidad médica que estudia las glándulas endocrinas y sus secreciones'
  },
  {
    name: 'Gastroenterología',
    description: 'Especialidad médica que estudia el aparato digestivo y sus enfermedades'
  }
];

async function seedSpecialties() {
  console.log('🌱 Iniciando la siembra de especialidades...');

  try {
    // Verificar si ya existen especialidades
    const existingCount = await prisma.specialty.count();
    
    if (existingCount > 0) {
      console.log(`✅ Ya existen ${existingCount} especialidades en la base de datos`);
      return;
    }

    // Crear especialidades
    for (const specialty of specialties) {
      await prisma.specialty.create({
        data: specialty
      });
      console.log(`✅ Creada especialidad: ${specialty.name}`);
    }

    console.log(`🎉 Se crearon ${specialties.length} especialidades exitosamente`);
  } catch (error) {
    console.error('❌ Error al crear especialidades:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedSpecialties();
}

export default seedSpecialties;
