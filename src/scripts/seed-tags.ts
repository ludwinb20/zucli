import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding tags...');

  // Tags/Categorías principales
  const tags = [
    {
      name: 'especialidad',
      description: 'Servicios relacionados con especialidades médicas'
    },
    {
      name: 'hospitalizacion',
      description: 'Servicios de hospitalización'
    },
    {
      name: 'cirugia',
      description: 'Procedimientos quirúrgicos'
    },
    {
      name: 'rayos_x',
      description: 'Servicios de radiología'
    },
    {
      name: 'laboratorio',
      description: 'Servicios de laboratorio clínico'
    },
    {
      name: 'farmacia',
      description: 'Medicamentos y productos farmacéuticos'
    },
    {
      name: 'emergencia',
      description: 'Servicios de emergencia'
    },
    {
      name: 'otros',
      description: 'Otros servicios médicos'
    }
  ];

  for (const tag of tags) {
    const existingTag = await prisma.tag.findUnique({
      where: { name: tag.name }
    });

    if (existingTag) {
      console.log(`  ⏭️  Tag "${tag.name}" ya existe, saltando...`);
      continue;
    }

    const newTag = await prisma.tag.create({
      data: tag
    });

    console.log(`  ✅ Tag creado: ${newTag.name}`);
  }

  console.log('\n✨ Seed de tags completado!');
}

main()
  .catch((e) => {
    console.error('❌ Error al hacer seed de tags:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

