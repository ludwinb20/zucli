import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPrices() {
  console.log('💰 Seeding prices...');

  // Obtener referencias necesarias
  const specialties = await prisma.specialty.findMany();
  const tags = await prisma.tag.findMany();

  const tagEspecialidad = tags.find(t => t.name === 'especialidad');
  const tagHospitalizacion = tags.find(t => t.name === 'hospitalizaciones');
  const tagCirugia = tags.find(t => t.name === 'cirugias');
  const tagRayosX = tags.find(t => t.name === 'rayos_x');
  const tagOtros = tags.find(t => t.name === 'otros');

  // Limpiar precios existentes (comentado para evitar conflictos con FKs)
  // await prisma.serviceItem.deleteMany({});
  // console.log('🗑️  Precios anteriores eliminados');

  const allPrices = [];

  // ===== CONSULTAS POR ESPECIALIDAD =====
  console.log('\n🏥 Creando consultas por especialidad...');
  
  for (const specialty of specialties) {
    const price = await prisma.serviceItem.create({
      data: {
        name: `Consulta ${specialty.name}`,
        description: `Consulta especializada de ${specialty.name.toLowerCase()}`,
        type: 'servicio',
        basePrice: specialty.name === 'Medicina General' ? 300 : 
                   specialty.name === 'Pediatría' ? 400 :
                   specialty.name === 'Cardiología' ? 500 :
                   specialty.name === 'Ginecología' ? 500 :
                   450,
        isActive: true,
        tags: tagEspecialidad ? {
          create: [{ tagId: tagEspecialidad.id }]
        } : undefined,
        specialties: {
          create: [{ specialtyId: specialty.id }]
        },
        variants: specialty.name === 'Medicina General' ? {
          create: [
            { name: 'Nocturna', description: 'Horario 6PM-10PM', price: 400, isActive: true },
            { name: 'Fin de Semana', description: 'Sábado o domingo', price: 450, isActive: true }
          ]
        } : specialty.name === 'Pediatría' ? {
          create: [
            { name: 'Control de Niño Sano', description: 'Control y vacunación', price: 350, isActive: true },
            { name: 'Urgencia Pediátrica', description: 'Atención urgente', price: 600, isActive: true }
          ]
        } : specialty.name === 'Cardiología' ? {
          create: [
            { name: 'Con ECG', description: 'Incluye electrocardiograma', price: 700, isActive: true }
          ]
        } : specialty.name === 'Ginecología' ? {
          create: [
            { name: 'Control Prenatal', description: 'Seguimiento embarazo', price: 600, isActive: true }
          ]
        } : undefined
      }
    });
    allPrices.push(price);
  }

  console.log(`✅ ${specialties.length} consultas creadas`);

  // ===== MEDICAMENTOS =====
  console.log('\n💊 Creando medicamentos...');

  const medicamentos = [
    { name: 'Paracetamol 500mg', desc: 'Analgésico y antipirético', price: 5, variants: [{ name: 'Caja 100 tab', desc: 'Comercial', price: 450 }] },
    { name: 'Ibuprofeno 400mg', desc: 'AINE antiinflamatorio', price: 8, variants: [{ name: '600mg', desc: 'Mayor concentración', price: 12 }] },
    { name: 'Amoxicilina 500mg', desc: 'Antibiótico amplio espectro', price: 15, variants: [{ name: 'Suspensión 250mg', desc: 'Pediátrico', price: 85 }] },
    { name: 'Omeprazol 20mg', desc: 'Inhibidor bomba protones', price: 10, variants: [] },
    { name: 'Loratadina 10mg', desc: 'Antihistamínico', price: 6, variants: [{ name: 'Jarabe 60ml', desc: 'Pediátrico', price: 95 }] },
    { name: 'Aspirina 100mg', desc: 'Antiagregante plaquetario', price: 3, variants: [] },
    { name: 'Metformina 850mg', desc: 'Antidiabético', price: 7, variants: [{ name: '500mg', desc: 'Menor dosis', price: 5 }] },
    { name: 'Losartán 50mg', desc: 'Antihipertensivo', price: 12, variants: [{ name: '100mg', desc: 'Mayor dosis', price: 18 }] },
    { name: 'Cetirizina 10mg', desc: 'Antihistamínico 2da gen', price: 8, variants: [] },
    { name: 'Salbutamol Inhalador', desc: 'Broncodilatador', price: 120, variants: [{ name: 'Nebulización', desc: 'Solución', price: 25 }] },
    { name: 'Enalapril 10mg', desc: 'Antihipertensivo IECA', price: 9, variants: [{ name: '20mg', desc: 'Mayor dosis', price: 14 }] },
    { name: 'Atorvastatina 20mg', desc: 'Estatina para colesterol', price: 15, variants: [{ name: '40mg', desc: 'Mayor dosis', price: 22 }] },
  ];

  for (const med of medicamentos) {
    const price = await prisma.serviceItem.create({
      data: {
        name: med.name,
        description: med.desc,
        type: 'medicamento',
        basePrice: med.price,
        isActive: true,
        tags: tagOtros ? {
          create: [{ tagId: tagOtros.id }]
        } : undefined,
        variants: med.variants.length > 0 ? {
          create: med.variants.map(v => ({
            name: v.name,
            description: v.desc,
            price: v.price,
            isActive: true
          }))
        } : undefined
      }
    });
    allPrices.push(price);
  }

  console.log(`✅ ${medicamentos.length} medicamentos creados`);

  // ===== SERVICIOS DE RAYOS X =====
  console.log('\n📸 Creando servicios de rayos X...');

  const rayosX = [
    { name: 'Rayos X Tórax', desc: 'Radiografía AP y lateral', price: 250, variants: [{ name: 'Digital', desc: 'Entrega inmediata', price: 350 }] },
    { name: 'Rayos X Cráneo', desc: 'Radiografía craneal', price: 280, variants: [] },
    { name: 'Rayos X Abdomen', desc: 'Radiografía abdominal simple', price: 260, variants: [] },
    { name: 'Rayos X Columna', desc: 'Estudio de columna vertebral', price: 300, variants: [] },
    { name: 'Rayos X Extremidades', desc: 'Radiografía de brazos/piernas', price: 220, variants: [] },
  ];

  for (const rx of rayosX) {
    const price = await prisma.serviceItem.create({
      data: {
        name: rx.name,
        description: rx.desc,
        type: 'servicio',
        basePrice: rx.price,
        isActive: true,
        tags: tagRayosX ? {
          create: [{ tagId: tagRayosX.id }]
        } : undefined,
        variants: rx.variants.length > 0 ? {
          create: rx.variants.map(v => ({
            name: v.name,
            description: v.desc,
            price: v.price,
            isActive: true
          }))
        } : undefined
      }
    });
    allPrices.push(price);
  }

  console.log(`✅ ${rayosX.length} servicios de rayos X creados`);

  // ===== HOSPITALIZACIÓN =====
  console.log('\n🏨 Creando servicios de hospitalización...');

  const hosp = await prisma.serviceItem.create({
    data: {
      name: 'Hospitalización Día',
      description: 'Costo por día en sala general',
      type: 'servicio',
      basePrice: 1200,
      isActive: true,
      tags: tagHospitalizacion ? {
        create: [{ tagId: tagHospitalizacion.id }]
      } : undefined,
      variants: {
        create: [
          { name: 'Sala Privada', description: 'Habitación individual', price: 2000, isActive: true },
          { name: 'UCI', description: 'Cuidados intensivos', price: 3500, isActive: true }
        ]
      }
    }
  });
  allPrices.push(hosp);

  console.log('✅ 1 servicio de hospitalización creado');

  // ===== CIRUGÍAS Y PROCEDIMIENTOS =====
  console.log('\n⚕️  Creando procedimientos quirúrgicos...');

  const cirugias = [
    { name: 'Cirugía Menor', desc: 'Procedimientos ambulatorios', price: 1500, variants: [] },
    { name: 'Sutura Simple', desc: 'Cierre de heridas', price: 350, variants: [{ name: 'Compleja', desc: 'Múltiples capas', price: 550 }] },
    { name: 'Drenaje Absceso', desc: 'Drenaje quirúrgico', price: 800, variants: [] },
  ];

  for (const cir of cirugias) {
    const price = await prisma.serviceItem.create({
      data: {
        name: cir.name,
        description: cir.desc,
        type: 'servicio',
        basePrice: cir.price,
        isActive: true,
        tags: tagCirugia ? {
          create: [{ tagId: tagCirugia.id }]
        } : undefined,
        variants: cir.variants.length > 0 ? {
          create: cir.variants.map(v => ({
            name: v.name,
            description: v.desc,
            price: v.price,
            isActive: true
          }))
        } : undefined
      }
    });
    allPrices.push(price);
  }

  console.log(`✅ ${cirugias.length} procedimientos creados`);

  // ===== OTROS SERVICIOS =====
  console.log('\n🏥 Creando otros servicios...');

  const otros = [
    { name: 'Curación', desc: 'Limpieza de heridas', price: 150, variants: [{ name: 'Avanzada', desc: 'Heridas complejas', price: 250 }] },
    { name: 'Aplicación Inyección IM', desc: 'Vía intramuscular', price: 50, variants: [{ name: 'IV', desc: 'Vía intravenosa', price: 75 }] },
    { name: 'Electrocardiograma', desc: 'ECG', price: 200, variants: [], specialty: 'Cardiología' },
    { name: 'Toma de Presión', desc: 'Monitoreo presión arterial', price: 30, variants: [] },
    { name: 'Glucometría', desc: 'Medición glucosa', price: 40, variants: [] },
  ];

  for (const srv of otros) {
    const specialtyForService = srv.specialty ? specialties.find(s => s.name === srv.specialty) : null;
    
    const price = await prisma.serviceItem.create({
      data: {
        name: srv.name,
        description: srv.desc,
        type: 'servicio',
        basePrice: srv.price,
        isActive: true,
        tags: tagOtros ? {
          create: [{ tagId: tagOtros.id }]
        } : undefined,
        specialties: specialtyForService ? {
          create: [{ specialtyId: specialtyForService.id }]
        } : undefined,
        variants: srv.variants.length > 0 ? {
          create: srv.variants.map(v => ({
            name: v.name,
            description: v.desc,
            price: v.price,
            isActive: true
          }))
        } : undefined
      }
    });
    allPrices.push(price);
  }

  console.log(`✅ ${otros.length} otros servicios creados`);
  console.log(`\n💰 Total: ${allPrices.length} precios creados con tags, especialidades y variantes`);
}

// Exportar como default para uso en otros scripts
export default seedPrices;

// Solo ejecutar si se llama directamente
if (require.main === module) {
  seedPrices()
    .catch((e) => {
      console.error('❌ Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

