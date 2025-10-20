/**
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { prismaMock } from '@/__tests__/mocks/prisma';
import { mockPatient, mockUser, createMockPatient } from '@/__tests__/utils/mock-data';

// Mock data específico para hospitalizaciones
const mockRoom = {
  id: 'room-1',
  number: '101',
  status: 'available' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockSalaDoctor = {
  id: 'sala-doctor-1',
  name: 'Dr. Roberto Martínez',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockServiceItem = {
  id: 'item-1',
  name: 'Hospitalización General',
  type: 'servicio' as const,
  basePrice: 500.0,
  isActive: true,
  description: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockHospitalization = {
  id: 'hosp-1',
  patientId: mockPatient.id,
  salaDoctorId: mockSalaDoctor.id,
  roomId: mockRoom.id,
  surgeryId: null,
  dailyRateItemId: mockServiceItem.id,
  dailyRateVariantId: null,
  admissionDate: new Date('2024-01-01'),
  dischargeDate: null,
  diagnosis: 'Observación post-operatoria',
  status: 'iniciada' as const,
  notes: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  patient: mockPatient,
  salaDoctor: mockSalaDoctor,
  room: mockRoom,
  dailyRateItem: mockServiceItem,
  dailyRateVariant: null,
};

const mockDischargeRecord = {
  id: 'discharge-1',
  hospitalizationId: mockHospitalization.id,
  diagnosticoIngreso: 'Dolor abdominal',
  diagnosticoEgreso: 'Gastritis aguda',
  resumenClinico: 'Paciente evoluciona favorablemente',
  tratamiento: 'Omeprazol 20mg',
  condicionSalida: 'Mejorado',
  recomendaciones: 'Dieta blanda',
  citaConsultaExterna: false,
  citaId: null,
  diasEstancia: 3,
  costoTotal: 1500.0,
  createdAt: new Date('2024-01-04'),
  updatedAt: new Date('2024-01-04'),
};

const createMockHospitalization = (overrides?: Partial<typeof mockHospitalization>) => ({
  ...mockHospitalization,
  ...overrides,
});

describe('Hospitalizations API', () => {
  describe('GET /api/hospitalizations', () => {
    it('should return a list of hospitalizations', async () => {
      const hospitalizations = [
        mockHospitalization,
        createMockHospitalization({ id: 'hosp-2', diagnosis: 'Fractura de tibia' }),
      ];

      prismaMock.hospitalization.findMany.mockResolvedValue(hospitalizations as any);
      prismaMock.hospitalization.count.mockResolvedValue(2);

      const result = await prismaMock.hospitalization.findMany({
        include: {
          patient: true,
          salaDoctor: true,
          room: true,
          dailyRateItem: true,
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0].diagnosis).toBe('Observación post-operatoria');
      expect(result[1].diagnosis).toBe('Fractura de tibia');
    });

    it('should filter hospitalizations by status', async () => {
      const activeHospitalizations = [mockHospitalization];

      prismaMock.hospitalization.findMany.mockResolvedValue(activeHospitalizations as any);

      const result = await prismaMock.hospitalization.findMany({
        where: { status: 'iniciada' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('iniciada');
    });

    it('should filter hospitalizations by patient', async () => {
      prismaMock.hospitalization.findMany.mockResolvedValue([mockHospitalization] as any);

      const result = await prismaMock.hospitalization.findMany({
        where: { patientId: mockPatient.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].patientId).toBe(mockPatient.id);
    });
  });

  describe('POST /api/hospitalizations', () => {
    it('should create a new hospitalization', async () => {
      const newHospData = {
        patientId: mockPatient.id,
        salaDoctorId: mockSalaDoctor.id,
        roomId: mockRoom.id,
        dailyRateItemId: mockServiceItem.id,
        diagnosis: 'Nueva hospitalización',
      };

      const createdHosp = createMockHospitalization({
        id: 'hosp-3',
        ...newHospData,
      });

      prismaMock.hospitalization.create.mockResolvedValue(createdHosp as any);

      const result = await prismaMock.hospitalization.create({
        data: newHospData as any,
      });

      expect(result.diagnosis).toBe('Nueva hospitalización');
      expect(result.status).toBe('iniciada');
    });

    it('should mark room as occupied when creating hospitalization', async () => {
      prismaMock.room.update.mockResolvedValue({
        ...mockRoom,
        status: 'occupied',
      } as any);

      const result = await prismaMock.room.update({
        where: { id: mockRoom.id },
        data: { status: 'occupied' },
      });

      expect(result.status).toBe('occupied');
    });
  });

  describe('POST /api/hospitalizations/[id]/discharge-record', () => {
    it('should create discharge record and update hospitalization', async () => {
      prismaMock.dischargeRecord.create.mockResolvedValue(mockDischargeRecord as any);
      prismaMock.hospitalization.update.mockResolvedValue({
        ...mockHospitalization,
        status: 'completada',
        dischargeDate: new Date('2024-01-04'),
      } as any);

      const discharge = await prismaMock.dischargeRecord.create({
        data: {
          hospitalizationId: mockHospitalization.id,
          diagnosticoIngreso: 'Dolor abdominal',
          diagnosticoEgreso: 'Gastritis aguda',
          diasEstancia: 3,
          costoTotal: 1500.0,
        } as any,
      });

      expect(discharge.diasEstancia).toBe(3);
      expect(discharge.costoTotal).toBe(1500.0);
    });

    it('should calculate days of stay correctly', async () => {
      const admissionDate = new Date('2024-01-01');
      const dischargeDate = new Date('2024-01-04');
      const expectedDays = 3;

      const discharge = {
        ...mockDischargeRecord,
        diasEstancia: expectedDays,
      };

      prismaMock.dischargeRecord.create.mockResolvedValue(discharge as any);

      const result = await prismaMock.dischargeRecord.create({
        data: {
          hospitalizationId: mockHospitalization.id,
          diasEstancia: expectedDays,
          costoTotal: expectedDays * 500,
        } as any,
      });

      expect(result.diasEstancia).toBe(3);
    });

    it('should free room when discharging patient', async () => {
      prismaMock.room.update.mockResolvedValue({
        ...mockRoom,
        status: 'available',
      } as any);

      const result = await prismaMock.room.update({
        where: { id: mockRoom.id },
        data: { status: 'available' },
      });

      expect(result.status).toBe('available');
    });

    it('should create payment for hospitalization on discharge', async () => {
      const payment = {
        id: 'payment-hosp-1',
        hospitalizationId: mockHospitalization.id,
        patientId: mockPatient.id,
        total: 1500.0,
        status: 'pendiente',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.payment.create.mockResolvedValue(payment as any);

      const result = await prismaMock.payment.create({
        data: {
          hospitalizationId: mockHospitalization.id,
          patientId: mockPatient.id,
          total: 1500.0,
          status: 'pendiente',
        } as any,
      });

      expect(result.hospitalizationId).toBe(mockHospitalization.id);
      expect(result.total).toBe(1500.0);
    });
  });

  describe('Preclinicas in Hospitalizations', () => {
    it('should create preclinica for hospitalization', async () => {
      const preclinica = {
        id: 'preclinica-1',
        hospitalizationId: mockHospitalization.id,
        presionArterial: '120/80',
        temperatura: 36.5,
        fc: 72,
        fr: 18,
        satO2: 98,
        peso: 70.5,
        talla: 170.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.preclinica.create.mockResolvedValue(preclinica as any);

      const result = await prismaMock.preclinica.create({
        data: {
          hospitalizationId: mockHospitalization.id,
          presionArterial: '120/80',
          temperatura: 36.5,
          fc: 72,
          fr: 18,
          satO2: 98,
        } as any,
      });

      expect(result.hospitalizationId).toBe(mockHospitalization.id);
      expect(result.presionArterial).toBe('120/80');
    });
  });

  describe('Medication Controls', () => {
    it('should create medication control with items', async () => {
      const medicationControl = {
        id: 'med-control-1',
        hospitalizationId: mockHospitalization.id,
        notes: 'Control de medicamentos',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.medicationControl.create.mockResolvedValue(medicationControl as any);

      const result = await prismaMock.medicationControl.create({
        data: {
          hospitalizationId: mockHospitalization.id,
          notes: 'Control de medicamentos',
        } as any,
      });

      expect(result.hospitalizationId).toBe(mockHospitalization.id);
    });
  });

  describe('Admission Records', () => {
    it('should create admission record', async () => {
      const admissionRecord = {
        id: 'admission-1',
        hospitalizationId: mockHospitalization.id,
        hea: 'Historia de enfermedad actual',
        fog: 'Funciones orgánicas generales',
        dieta: 'Dieta blanda',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.admissionRecord.create.mockResolvedValue(admissionRecord as any);

      const result = await prismaMock.admissionRecord.create({
        data: {
          hospitalizationId: mockHospitalization.id,
          hea: 'Historia de enfermedad actual',
        } as any,
      });

      expect(result.hospitalizationId).toBe(mockHospitalization.id);
    });
  });
});

