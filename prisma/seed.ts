import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seeders...');

  // ============================================
  // 1. CREAR ROLES
  // ============================================
  console.log('\n📋 Creando roles...');
  
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: { name: 'admin' },
    }),
    prisma.role.upsert({
      where: { name: 'especialista' },
      update: {},
      create: { name: 'especialista' },
    }),
    prisma.role.upsert({
      where: { name: 'caja' },
      update: {},
      create: { name: 'caja' },
    }),
    prisma.role.upsert({
      where: { name: 'recepcion' },
      update: {},
      create: { name: 'recepcion' },
    }),
    prisma.role.upsert({
      where: { name: 'radiologo' },
      update: {},
      create: { name: 'radiologo' },
    }),
  ]);

  console.log(`✅ ${roles.length} roles creados`);

  // ============================================
  // 2. CREAR ESPECIALIDADES
  // ============================================
  console.log('\n🏥 Creando especialidades...');
  
  const specialties = await Promise.all([
    prisma.specialty.upsert({
      where: { name: 'Medicina General' },
      update: {},
      create: {
        name: 'Medicina General',
        description: 'Atención médica general y consultas de rutina',
        isActive: true,
      },
    }),
    prisma.specialty.upsert({
      where: { name: 'Pediatría' },
      update: {},
      create: {
        name: 'Pediatría',
        description: 'Especialidad enfocada en la salud de niños y adolescentes',
        isActive: true,
      },
    }),
    prisma.specialty.upsert({
      where: { name: 'Cardiología' },
      update: {},
      create: {
        name: 'Cardiología',
        description: 'Diagnóstico y tratamiento de enfermedades del corazón',
        isActive: true,
      },
    }),
    prisma.specialty.upsert({
      where: { name: 'Dermatología' },
      update: {},
      create: {
        name: 'Dermatología',
        description: 'Tratamiento de enfermedades de la piel',
        isActive: true,
      },
    }),
    prisma.specialty.upsert({
      where: { name: 'Ginecología' },
      update: {},
      create: {
        name: 'Ginecología',
        description: 'Salud reproductiva femenina',
        isActive: true,
      },
    }),
    prisma.specialty.upsert({
      where: { name: 'Traumatología' },
      update: {},
      create: {
        name: 'Traumatología',
        description: 'Lesiones del sistema musculoesquelético',
        isActive: true,
      },
    }),
    prisma.specialty.upsert({
      where: { name: 'Oftalmología' },
      update: {},
      create: {
        name: 'Oftalmología',
        description: 'Especialidad de salud visual',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ ${specialties.length} especialidades creadas`);

  // ============================================
  // 3. CREAR USUARIOS
  // ============================================
  console.log('\n👥 Creando usuarios...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminRole = roles.find(r => r.name === 'admin');
  const especialistaRole = roles.find(r => r.name === 'especialista');
  const cajaRole = roles.find(r => r.name === 'caja');
  const recepcionRole = roles.find(r => r.name === 'recepcion');

  const medicinaGeneral = specialties.find(s => s.name === 'Medicina General');
  const pediatria = specialties.find(s => s.name === 'Pediatría');
  const cardiologia = specialties.find(s => s.name === 'Cardiología');

  const users = await Promise.all([
    // Administrador
    prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        name: 'Administrador del Sistema',
        roleId: adminRole!.id,
        isActive: true,
      },
    }),
    // Especialistas
    prisma.user.upsert({
      where: { username: 'dr.martinez' },
      update: {},
      create: {
        username: 'dr.martinez',
        password: hashedPassword,
        name: 'Dr. Carlos Martínez',
        roleId: especialistaRole!.id,
        specialtyId: medicinaGeneral!.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'dra.lopez' },
      update: {},
      create: {
        username: 'dra.lopez',
        password: hashedPassword,
        name: 'Dra. María López',
        roleId: especialistaRole!.id,
        specialtyId: pediatria!.id,
        isActive: true,
      },
    }),
    prisma.user.upsert({
      where: { username: 'dr.garcia' },
      update: {},
      create: {
        username: 'dr.garcia',
        password: hashedPassword,
        name: 'Dr. Roberto García',
        roleId: especialistaRole!.id,
        specialtyId: cardiologia!.id,
        isActive: true,
      },
    }),
    // Personal de caja
    prisma.user.upsert({
      where: { username: 'caja1' },
      update: {},
      create: {
        username: 'caja1',
        password: hashedPassword,
        name: 'Ana Ramírez',
        roleId: cajaRole!.id,
        isActive: true,
      },
    }),
    // Personal de recepción
    prisma.user.upsert({
      where: { username: 'recepcion1' },
      update: {},
      create: {
        username: 'recepcion1',
        password: hashedPassword,
        name: 'Laura Hernández',
        roleId: recepcionRole!.id,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ ${users.length} usuarios creados`);
  console.log('   📝 Credenciales por defecto: username / password123');

  // ============================================
  // 4. CREAR PACIENTES
  // ============================================
  console.log('\n🏥 Creando pacientes...');

  const patients = await Promise.all([
    prisma.patient.upsert({
      where: { identityNumber: '0801-1990-12345' },
      update: {},
      create: {
        firstName: 'Juan',
        lastName: 'Pérez González',
        birthDate: new Date('1990-05-15'),
        gender: 'Masculino',
        identityNumber: '0801-1990-12345',
        phone: '9876-5432',
        address: 'Col. Las Colinas, Tegucigalpa',
        emergencyContactName: 'María Pérez',
        emergencyContactNumber: '9876-5433',
        emergencyContactRelation: 'Esposa',
        medicalHistory: 'Sin antecedentes relevantes',
        allergies: 'Penicilina',
      },
    }),
    prisma.patient.upsert({
      where: { identityNumber: '0801-1985-54321' },
      update: {},
      create: {
        firstName: 'María',
        lastName: 'Rodríguez López',
        birthDate: new Date('1985-08-22'),
        gender: 'Femenino',
        identityNumber: '0801-1985-54321',
        phone: '3345-6789',
        address: 'Col. Kennedy, Tegucigalpa',
        emergencyContactName: 'Pedro Rodríguez',
        emergencyContactNumber: '3345-6790',
        emergencyContactRelation: 'Hermano',
        medicalHistory: 'Hipertensión controlada',
        allergies: 'Ninguna',
      },
    }),
    prisma.patient.upsert({
      where: { identityNumber: '0801-2010-11111' },
      update: {},
      create: {
        firstName: 'Sofía',
        lastName: 'Martínez Cruz',
        birthDate: new Date('2010-03-10'),
        gender: 'Femenino',
        identityNumber: '0801-2010-11111',
        phone: '2234-5678',
        address: 'Col. Miramontes, Tegucigalpa',
        emergencyContactName: 'Ana Cruz',
        emergencyContactNumber: '2234-5679',
        emergencyContactRelation: 'Madre',
        medicalHistory: 'Saludable',
        allergies: 'Ninguna',
      },
    }),
    prisma.patient.upsert({
      where: { identityNumber: '0801-1978-22222' },
      update: {},
      create: {
        firstName: 'Carlos',
        lastName: 'Hernández Díaz',
        birthDate: new Date('1978-11-30'),
        gender: 'Masculino',
        identityNumber: '0801-1978-22222',
        phone: '9988-7766',
        address: 'Res. El Pedregal, Tegucigalpa',
        emergencyContactName: 'Rosa Díaz',
        emergencyContactNumber: '9988-7767',
        emergencyContactRelation: 'Esposa',
        medicalHistory: 'Diabetes tipo 2',
        allergies: 'Sulfa',
      },
    }),
    prisma.patient.upsert({
      where: { identityNumber: '0801-1995-33333' },
      update: {},
      create: {
        firstName: 'Andrea',
        lastName: 'Flores Mejía',
        birthDate: new Date('1995-07-18'),
        gender: 'Femenino',
        identityNumber: '0801-1995-33333',
        phone: '3312-4567',
        address: 'Col. Rubén Darío, Tegucigalpa',
        emergencyContactName: 'Luis Flores',
        emergencyContactNumber: '3312-4568',
        emergencyContactRelation: 'Padre',
        medicalHistory: 'Asma leve',
        allergies: 'Polen',
      },
    }),
    prisma.patient.upsert({
      where: { identityNumber: '0801-2015-44444' },
      update: {},
      create: {
        firstName: 'Miguel',
        lastName: 'Castro Vargas',
        birthDate: new Date('2015-01-25'),
        gender: 'Masculino',
        identityNumber: '0801-2015-44444',
        phone: '2245-6789',
        address: 'Col. La Granja, Tegucigalpa',
        emergencyContactName: 'Claudia Vargas',
        emergencyContactNumber: '2245-6790',
        emergencyContactRelation: 'Madre',
        medicalHistory: 'Saludable',
        allergies: 'Ninguna',
      },
    }),
    prisma.patient.upsert({
      where: { identityNumber: '0801-1982-55555' },
      update: {},
      create: {
        firstName: 'Roberto',
        lastName: 'Sánchez Ortiz',
        birthDate: new Date('1982-09-12'),
        gender: 'Masculino',
        identityNumber: '0801-1982-55555',
        phone: '9876-1234',
        address: 'Col. Palmira, Tegucigalpa',
        emergencyContactName: 'Patricia Ortiz',
        emergencyContactNumber: '9876-1235',
        emergencyContactRelation: 'Esposa',
        medicalHistory: 'Colesterol alto',
        allergies: 'Mariscos',
      },
    }),
    prisma.patient.upsert({
      where: { identityNumber: '0801-1998-66666' },
      update: {},
      create: {
        firstName: 'Daniela',
        lastName: 'Morales Reyes',
        birthDate: new Date('1998-04-05'),
        gender: 'Femenino',
        identityNumber: '0801-1998-66666',
        phone: '3389-4567',
        address: 'Col. Lomas del Guijarro, Tegucigalpa',
        emergencyContactName: 'José Morales',
        emergencyContactNumber: '3389-4568',
        emergencyContactRelation: 'Padre',
        medicalHistory: 'Saludable',
        allergies: 'Ibuprofeno',
      },
    }),
  ]);

  console.log(`✅ ${patients.length} pacientes creados`);

  // ============================================
  // 5. CREAR CITAS
  // ============================================
  console.log('\n📅 Creando citas médicas...');

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const appointments = await Promise.all([
    // Citas programadas (futuras)
    prisma.appointment.create({
      data: {
        patientId: patients[0].id,
        specialtyId: medicinaGeneral!.id,
        appointmentDate: tomorrow,
        status: 'programado',
        notes: 'Consulta de control',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[1].id,
        specialtyId: cardiologia!.id,
        appointmentDate: nextWeek,
        status: 'programado',
        notes: 'Control de presión arterial',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[2].id,
        specialtyId: pediatria!.id,
        appointmentDate: tomorrow,
        status: 'programado',
        notes: 'Vacunación',
      },
    }),
    // Citas pendientes (hoy)
    prisma.appointment.create({
      data: {
        patientId: patients[3].id,
        specialtyId: medicinaGeneral!.id,
        appointmentDate: today,
        status: 'pendiente',
        notes: 'Consulta general',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[4].id,
        specialtyId: pediatria!.id,
        appointmentDate: today,
        status: 'pendiente',
        notes: 'Control de asma',
      },
    }),
    // Citas completadas (ayer)
    prisma.appointment.create({
      data: {
        patientId: patients[5].id,
        specialtyId: pediatria!.id,
        appointmentDate: yesterday,
        status: 'completado',
        notes: 'Consulta de rutina',
      },
    }),
    prisma.appointment.create({
      data: {
        patientId: patients[6].id,
        specialtyId: cardiologia!.id,
        appointmentDate: yesterday,
        status: 'completado',
        notes: 'Electrocardiograma',
      },
    }),
    // Cita cancelada
    prisma.appointment.create({
      data: {
        patientId: patients[7].id,
        specialtyId: medicinaGeneral!.id,
        appointmentDate: yesterday,
        status: 'cancelado',
        notes: 'Paciente no se presentó',
      },
    }),
  ]);

  console.log(`✅ ${appointments.length} citas creadas`);

  // ============================================
  // 6. CREAR TAGS PARA PRECIOS
  // ============================================
  console.log('\n🏷️  Creando tags para sistema de precios...');

  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'especialidad' },
      update: {},
      create: {
        name: 'especialidad',
        description: 'Servicios específicos por especialidad médica',
      },
    }),
    prisma.tag.upsert({
      where: { name: 'hospitalizaciones' },
      update: {},
      create: {
        name: 'hospitalizaciones',
        description: 'Servicios relacionados con hospitalización',
      },
    }),
    prisma.tag.upsert({
      where: { name: 'cirugias' },
      update: {},
      create: {
        name: 'cirugias',
        description: 'Procedimientos quirúrgicos',
      },
    }),
    prisma.tag.upsert({
      where: { name: 'rayos_x' },
      update: {},
      create: {
        name: 'rayos_x',
        description: 'Estudios radiológicos',
      },
    }),
    prisma.tag.upsert({
      where: { name: 'otros' },
      update: {},
      create: {
        name: 'otros',
        description: 'Otros servicios médicos',
      },
    }),
  ]);

  console.log(`✅ ${tags.length} tags creados`);

  // ============================================
  // 7. CREAR PRECIOS - Usar seeder separado
  // ============================================
  console.log('\n💰 Para crear precios, ejecuta: npx tsx prisma/seed-prices.ts');
  const totalPrices = await prisma.serviceItem.count();

  console.log('\n✅ ¡Seeders completados exitosamente!\n');
  console.log('📊 Resumen:');
  console.log(`   - ${roles.length} roles`);
  console.log(`   - ${specialties.length} especialidades`);
  console.log(`   - ${users.length} usuarios`);
  console.log(`   - ${patients.length} pacientes`);
  console.log(`   - ${appointments.length} citas`);
  console.log(`   - ${tags.length} tags`);
  console.log(`   - ${totalPrices} precios\n`);
  console.log('🔑 Credenciales de acceso:');
  console.log('   Admin: admin / password123');
  console.log('   Especialista: dr.martinez / password123');
  console.log('   Caja: caja1 / password123');
  console.log('   Recepción: recepcion1 / password123\n');
}

// Exportar main para uso en otros scripts
export { main };

// Solo ejecutar si se llama directamente
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('❌ Error ejecutando seeders:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
