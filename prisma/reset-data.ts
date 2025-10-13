import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetData() {
  console.log('🗑️  Limpiando datos de la base de datos...\n');

  try {
    // Desactivar foreign key checks temporalmente (MySQL)
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;

    // Eliminar datos en orden inverso a las dependencias
    console.log('📋 Eliminando datos de tablas...');

    // 1. Facturas
    await prisma.invoice.deleteMany({});
    console.log('  ✓ invoices');
    
    await prisma.invoiceRange.deleteMany({});
    console.log('  ✓ invoice_ranges');

    // 2. Items de transacción
    await prisma.transactionItem.deleteMany({});
    console.log('  ✓ transaction_items');

    // 3. Pagos, ventas, hospitalizaciones y consultas
    await prisma.payment.deleteMany({});
    console.log('  ✓ payments');
    
    await prisma.sale.deleteMany({});
    console.log('  ✓ sales');
    
    await prisma.hospitalization.deleteMany({});
    console.log('  ✓ hospitalizations');
    
    await prisma.consultation.deleteMany({});
    console.log('  ✓ consultations');

    // 4. Preclínicas y citas
    await prisma.preclinica.deleteMany({});
    console.log('  ✓ preclinicas');
    
    await prisma.appointment.deleteMany({});
    console.log('  ✓ appointments');

    // 5. Pacientes
    await prisma.patient.deleteMany({});
    console.log('  ✓ patients');

    // 6. Relaciones de precios
    await prisma.consultaEspecialidad.deleteMany({});
    console.log('  ✓ consulta_especialidad');
    
    await prisma.serviceItemToSpecialty.deleteMany({});
    console.log('  ✓ service_item_to_specialties');
    
    await prisma.serviceItemToTag.deleteMany({});
    console.log('  ✓ service_item_to_tags');

    // 7. Variantes y precios
    await prisma.serviceItemVariant.deleteMany({});
    console.log('  ✓ service_item_variants');
    
    await prisma.serviceItem.deleteMany({});
    console.log('  ✓ service_items');

    // 8. Tags
    await prisma.tag.deleteMany({});
    console.log('  ✓ tags');

    // 9. Usuarios
    await prisma.user.deleteMany({});
    console.log('  ✓ users');

    // 10. Días de especialidades y especialidades
    await prisma.specialtyDay.deleteMany({});
    console.log('  ✓ specialty_days');
    
    await prisma.specialty.deleteMany({});
    console.log('  ✓ specialties');

    // 11. Roles
    await prisma.role.deleteMany({});
    console.log('  ✓ roles');

    // 12. Servicios legacy (si existen)
    await prisma.servicePrice.deleteMany({});
    console.log('  ✓ service_prices');
    
    await prisma.service.deleteMany({});
    console.log('  ✓ services');

    // Reactivar foreign key checks
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;

    console.log('\n✅ Todos los datos han sido eliminados exitosamente!\n');
  } catch (error) {
    console.error('\n❌ Error eliminando datos:', error);
    throw error;
  }
}

async function runSeeders() {
  console.log('🌱 Ejecutando seeders...\n');

  try {
    // Importar y ejecutar el seeder principal
    const { main: seedMain } = await import('./seed');
    await seedMain();

    console.log('\n💰 Ejecutando seeder de precios...\n');
    
    // Importar y ejecutar el seeder de precios
    const { default: seedPrices } = await import('./seed-prices');
    await seedPrices();

    console.log('\n✅ Todos los seeders completados exitosamente!\n');
  } catch (error) {
    console.error('\n❌ Error ejecutando seeders:', error);
    throw error;
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 RESET Y SEED DE BASE DE DATOS');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. Limpiar datos
    await resetData();

    // 2. Ejecutar seeders
    await runSeeders();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 PROCESO COMPLETADO CON ÉXITO!');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ El proceso falló:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

