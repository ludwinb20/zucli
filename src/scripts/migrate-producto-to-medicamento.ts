import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Iniciando migración de "producto" a "medicamento"...\n');

  try {
    // Contar registros a actualizar
    const countToUpdate = await prisma.serviceItem.count({
      where: {
        type: 'producto'
      }
    });

    if (countToUpdate === 0) {
      console.log('✅ No hay registros para actualizar. Todos los items ya están actualizados.');
      return;
    }

    console.log(`📊 Registros encontrados con type="producto": ${countToUpdate}`);
    console.log('🔧 Actualizando registros...\n');

    // Actualizar todos los registros de "producto" a "medicamento"
    const result = await prisma.serviceItem.updateMany({
      where: {
        type: 'producto'
      },
      data: {
        type: 'medicamento'
      }
    });

    console.log(`✅ Migración completada exitosamente!`);
    console.log(`📝 Total de registros actualizados: ${result.count}\n`);

    // Verificar que no quedan registros con "producto"
    const remainingCount = await prisma.serviceItem.count({
      where: {
        type: 'producto'
      }
    });

    if (remainingCount === 0) {
      console.log('✅ Verificación: No quedan registros con type="producto"');
    } else {
      console.log(`⚠️  Advertencia: Aún quedan ${remainingCount} registros con type="producto"`);
    }

    // Mostrar resumen de tipos actuales
    const medicamentoCount = await prisma.serviceItem.count({
      where: { type: 'medicamento' }
    });
    const servicioCount = await prisma.serviceItem.count({
      where: { type: 'servicio' }
    });

    console.log('\n📊 Resumen de tipos en la base de datos:');
    console.log(`   - Medicamentos: ${medicamentoCount}`);
    console.log(`   - Servicios: ${servicioCount}`);
    console.log(`   - Total: ${medicamentoCount + servicioCount}\n`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✅ Migración finalizada correctamente.');
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Error fatal:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

