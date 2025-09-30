import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
    },
  });

  const especialistaRole = await prisma.role.upsert({
    where: { name: 'especialista' },
    update: {},
    create: {
      name: 'especialista',
    },
  });

  const recepcionRole = await prisma.role.upsert({
    where: { name: 'recepcion' },
    update: {},
    create: {
      name: 'recepcion',
    },
  });

  const cajaRole = await prisma.role.upsert({
    where: { name: 'caja' },
    update: {},
    create: {
      name: 'caja',
    },
  });

  // Hash de contraseñas
  const hashedPassword = await bcrypt.hash('123456', 12);

  // Crear usuarios de prueba
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@hospital.com',
      password: hashedPassword,
      name: 'Dr. Administrador',
      roleId: adminRole.id,
    },
  });

  const doctorUser = await prisma.user.upsert({
    where: { username: 'doctor' },
    update: {},
    create: {
      username: 'doctor',
      email: 'doctor@hospital.com',
      password: hashedPassword,
      name: 'Dr. García',
      roleId: especialistaRole.id,
    },
  });

  const recepcionUser = await prisma.user.upsert({
    where: { username: 'recepcion' },
    update: {},
    create: {
      username: 'recepcion',
      email: 'recepcion@hospital.com',
      password: hashedPassword,
      name: 'María Recepción',
      roleId: recepcionRole.id,
    },
  });

  const cajaUser = await prisma.user.upsert({
    where: { username: 'caja' },
    update: {},
    create: {
      username: 'caja',
      email: 'caja@hospital.com',
      password: hashedPassword,
      name: 'Ana Caja',
      roleId: cajaRole.id,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('👤 Test users created:');
  console.log('   - admin / 123456 (Administrador)');
  console.log('   - doctor / 123456 (Especialista)');
  console.log('   - recepcion / 123456 (Recepción)');
  console.log('   - caja / 123456 (Caja)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

