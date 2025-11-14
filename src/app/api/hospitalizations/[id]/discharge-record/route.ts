import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateDischargeRecordData } from '@/types/hospitalization';

// POST /api/hospitalizations/[id]/discharge-record - Crear registro de alta
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario tenga permisos
    if (!["admin", "recepcion", "especialista", "medico_sala"].includes(session.user.role?.name || "")) {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 });
    }

    const { id: hospitalizationId } = await params;
    const body: CreateDischargeRecordData = await request.json();

    // Verificar que la hospitalización existe
    const hospitalization = await prisma.hospitalization.findUnique({
      where: { id: hospitalizationId },
      select: { 
        id: true, 
        status: true, 
        admissionDate: true,
        patientId: true,
        roomId: true,
        surgeryId: true,
        dailyRateItemId: true,
        dailyRateVariantId: true,
        dailyRateItem: {
          select: { basePrice: true }
        },
        dailyRateVariant: {
          select: { price: true }
        }
      }
    });

    if (!hospitalization) {
      return NextResponse.json(
        { error: 'Hospitalización no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la hospitalización esté activa
    if (hospitalization.status !== 'iniciada') {
      return NextResponse.json(
        { error: 'Solo se pueden dar de alta hospitalizaciones activas' },
        { status: 400 }
      );
    }

    // Verificar que no exista ya un registro de alta
    const existingRecord = await prisma.dischargeRecord.findUnique({
      where: { hospitalizationId }
    });

    if (existingRecord) {
      return NextResponse.json(
        { error: 'Ya existe un registro de alta para esta hospitalización' },
        { status: 400 }
      );
    }

    // Validar que al menos un campo tenga contenido
    const hasContent = 
      body.diagnosticoIngreso?.trim() ||
      body.diagnosticoEgreso?.trim() ||
      body.resumenClinico?.trim() ||
      body.tratamiento?.trim() ||
      body.condicionSalida ||
      body.recomendaciones?.trim();

    if (!hasContent) {
      console.error('Validation failed: No content in discharge record', { body });
      return NextResponse.json(
        { error: 'Al menos un campo debe tener contenido' },
        { status: 400 }
      );
    }

    // Calcular días de estancia
    const admissionDate = new Date(hospitalization.admissionDate);
    const dischargeDate = new Date();
    const timeDiff = dischargeDate.getTime() - admissionDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const diasEstancia = Math.max(1, daysDiff); // Mínimo 1 día

    // Calcular costo total
    let precioPorDia = 0;
    if (hospitalization.dailyRateVariant?.price) {
      precioPorDia = Number(hospitalization.dailyRateVariant.price);
    } else if (hospitalization.dailyRateItem?.basePrice) {
      precioPorDia = Number(hospitalization.dailyRateItem.basePrice);
    }
    const costoTotal = diasEstancia * precioPorDia;

    // Crear el registro de alta
    const dischargeRecord = await prisma.dischargeRecord.create({
      data: {
        hospitalizationId,
        // Información de Alta
        diagnosticoIngreso: body.diagnosticoIngreso?.trim() || null,
        diagnosticoEgreso: body.diagnosticoEgreso?.trim() || null,
        resumenClinico: body.resumenClinico?.trim() || null,
        tratamiento: body.tratamiento?.trim() || null,
        condicionSalida: body.condicionSalida || null,
        recomendaciones: body.recomendaciones?.trim() || null,
        // Cita de Consulta Externa
        citaConsultaExterna: body.citaConsultaExterna,
        // Cálculo de días
        diasEstancia,
        costoTotal,
      }
    });

    // Actualizar el estado de la hospitalización
    await prisma.hospitalization.update({
      where: { id: hospitalizationId },
      data: {
        status: 'completada',
        dischargeDate: dischargeDate,
      }
    });

    // Liberar la habitación si está asignada
    if (hospitalization.roomId) {
      await prisma.room.update({
        where: { id: hospitalization.roomId },
        data: { status: 'available' }
      });
    }

    // Manejar el pago según si está relacionada con cirugía o no
    if (hospitalization.surgeryId) {
      // Si está relacionada con cirugía, buscar el pago de la cirugía
      const surgeryPayment = await prisma.payment.findFirst({
        where: { surgeryId: hospitalization.surgeryId }
      });

      if (surgeryPayment) {
        // Actualizar el total del pago sumando el costo de hospitalización
        await prisma.payment.update({
          where: { id: surgeryPayment.id },
          data: {
            total: surgeryPayment.total + costoTotal,
            notes: surgeryPayment.notes + `\n\nHospitalización agregada: ${diasEstancia} días × L${precioPorDia.toFixed(2)} = L${costoTotal.toFixed(2)}`
          }
        });
      }
    } else {
      // Si NO está relacionada con cirugía, manejar pago normalmente
      const existingPayment = await prisma.payment.findFirst({
        where: { hospitalizationId }
      });

      if (existingPayment) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            total: costoTotal,
            notes: `Actualizado automáticamente al dar de alta. ${diasEstancia} días × L${precioPorDia.toFixed(2)} = L${costoTotal.toFixed(2)}`
          }
        });
      } else {
        // Crear un nuevo pago si no existe
        await prisma.payment.create({
          data: {
            hospitalizationId,
            patientId: hospitalization.patientId,
            total: costoTotal,
            status: 'pendiente',
            notes: `Generado automáticamente al dar de alta. ${diasEstancia} días × L${precioPorDia.toFixed(2)} = L${costoTotal.toFixed(2)}`
          }
        });
      }
    }

    // Crear TransactionItem para el servicio de hospitalización
    if (hospitalization.dailyRateItemId) {
      // Obtener el nombre del item para el snapshot
      const serviceItem = await prisma.serviceItem.findUnique({
        where: { id: hospitalization.dailyRateItemId },
        select: { name: true }
      });

      if (serviceItem) {
        await prisma.transactionItem.create({
          data: {
            sourceType: 'hospitalization',
            sourceId: hospitalizationId,
            serviceItemId: hospitalization.dailyRateItemId,
            variantId: hospitalization.dailyRateVariantId || null,
            quantity: diasEstancia, // Los días como cantidad
            nombre: `${serviceItem.name} (${diasEstancia} día${diasEstancia !== 1 ? 's' : ''})`,
            precioUnitario: precioPorDia,
            descuento: 0,
            total: costoTotal,
            notes: `Servicio de hospitalización por ${diasEstancia} día${diasEstancia !== 1 ? 's' : ''}`
          }
        });
      }
    }

    // Crear cita si se solicitó
    let citaId: string | null = null;
    if (body.citaConsultaExterna && body.citaFecha && body.citaHora && body.citaEspecialidadId) {
      // Crear la cita en la tabla appointments
      const appointment = await prisma.appointment.create({
        data: {
          patientId: hospitalization.patientId,
          specialtyId: body.citaEspecialidadId,
          appointmentDate: new Date(`${body.citaFecha}T${body.citaHora}`),
          status: 'programado',
          notes: 'Cita agendada automáticamente al dar de alta de hospitalización'
        }
      });
      
      citaId = appointment.id;
      
      // Actualizar el discharge record con el citaId
      await prisma.dischargeRecord.update({
        where: { id: dischargeRecord.id },
        data: { citaId }
      });
    }

    return NextResponse.json(dischargeRecord, { status: 201 });

  } catch (error) {
    console.error('Error al crear registro de alta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/hospitalizations/[id]/discharge-record - Obtener registro de alta
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: hospitalizationId } = await params;

    // Verificar que la hospitalización existe
    const hospitalization = await prisma.hospitalization.findUnique({
      where: { id: hospitalizationId },
      select: { id: true }
    });

    if (!hospitalization) {
      return NextResponse.json(
        { error: 'Hospitalización no encontrada' },
        { status: 404 }
      );
    }

    // Obtener el registro de alta
    const dischargeRecord = await prisma.dischargeRecord.findUnique({
      where: { hospitalizationId },
      include: {
        cita: {
          select: {
            id: true,
            appointmentDate: true,
            status: true,
            specialty: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!dischargeRecord) {
      return NextResponse.json(
        { error: 'Registro de alta no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(dischargeRecord);

  } catch (error) {
    console.error('Error al obtener registro de alta:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
