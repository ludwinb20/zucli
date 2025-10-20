import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏥 Agregando rol de Radiólogo...');
  
  try {
    const role = await prisma.role.upsert({
      where: { name: 'radiologo' },
      update: {},
      create: { name: 'radiologo' },
    });
    
    console.log('✅ Rol de radiólogo creado/actualizado:', role);
  } catch (error) {
    console.error('❌ Error al crear rol:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

