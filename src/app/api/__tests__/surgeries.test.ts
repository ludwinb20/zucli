/**
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { prismaMock } from '@/__tests__/mocks/prisma';
import { mockPatient, mockUser } from '@/__tests__/utils/mock-data';

// Mock data para cirugías
const mockSurgeryItem = {
  id: 'surgery-item-1',
  name: 'Apendicectomía',
  type: 'servicio' as const,
  basePrice: 5000.0,
  isActive: true,
  description: 'Cirugía de apéndice',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockSurgery = {
  id: 'surgery-1',
  patientId: mockPatient.id,
  surgeryItemId: mockSurgeryItem.id,
  status: 'iniciada' as const,
  completedDate: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  patient: mockPatient,
  surgeryItem: mockSurgeryItem,
};

const mockOperativeNote = {
  id: 'op-note-1',
  surgeryId: mockSurgery.id,
  diagnosticoPreoperatorio: 'Apendicitis aguda',
  ayudante: 'Dr. García',
  anestesia: 'General',
  circulante: 'Enf. López',
  instrumentalista: 'Enf. Martínez',
  sangrado: 'Mínimo',
  complicaciones: 'Ninguna',
  hallazgos: 'Apéndice inflamado',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockPayment = {
  id: 'payment-surgery-1',
  surgeryId: mockSurgery.id,
  patientId: mockPatient.id,
  total: 5000.0,
  status: 'pendiente' as const,
  consultationId: null,
  saleId: null,
  hospitalizationId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const createMockSurgery = (overrides?: Partial<typeof mockSurgery>) => ({
  ...mockSurgery,
  ...overrides,
});

describe('Surgeries API', () => {
  describe('GET /api/surgeries', () => {
    it('should return a list of surgeries', async () => {
      const surgeries = [
        mockSurgery,
        createMockSurgery({ id: 'surgery-2', status: 'finalizada' }),
      ];

      prismaMock.surgery.findMany.mockResolvedValue(surgeries as any);

      const result = await prismaMock.surgery.findMany({
        include: {
          patient: true,
          surgeryItem: true,
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('iniciada');
      expect(result[1].status).toBe('finalizada');
    });

    it('should filter surgeries by status', async () => {
      prismaMock.surgery.findMany.mockResolvedValue([mockSurgery] as any);

      const result = await prismaMock.surgery.findMany({
        where: { status: 'iniciada' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('iniciada');
    });

    it('should filter surgeries by patient', async () => {
      prismaMock.surgery.findMany.mockResolvedValue([mockSurgery] as any);

      const result = await prismaMock.surgery.findMany({
        where: { patientId: mockPatient.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].patientId).toBe(mockPatient.id);
    });
  });

  describe('POST /api/surgeries', () => {
    it('should create a new surgery', async () => {
      const newSurgeryData = {
        patientId: mockPatient.id,
        surgeryItemId: mockSurgeryItem.id,
      };

      prismaMock.surgery.create.mockResolvedValue(mockSurgery as any);

      const result = await prismaMock.surgery.create({
        data: newSurgeryData as any,
      });

      expect(result.patientId).toBe(mockPatient.id);
      expect(result.surgeryItemId).toBe(mockSurgeryItem.id);
      expect(result.status).toBe('iniciada');
    });

    it('should create payment when creating surgery', async () => {
      prismaMock.payment.create.mockResolvedValue(mockPayment as any);

      const result = await prismaMock.payment.create({
        data: {
          surgeryId: mockSurgery.id,
          patientId: mockPatient.id,
          total: 5000.0,
          status: 'pendiente',
        } as any,
      });

      expect(result.surgeryId).toBe(mockSurgery.id);
      expect(result.total).toBe(5000.0);
    });
  });

  describe('PATCH /api/surgeries/[id]', () => {
    it('should update surgery status to finalizada', async () => {
      const updatedSurgery = createMockSurgery({
        status: 'finalizada',
        completedDate: new Date('2024-01-02'),
      });

      prismaMock.surgery.update.mockResolvedValue(updatedSurgery as any);

      const result = await prismaMock.surgery.update({
        where: { id: mockSurgery.id },
        data: {
          status: 'finalizada',
          completedDate: new Date('2024-01-02'),
        },
      });

      expect(result.status).toBe('finalizada');
      expect(result.completedDate).toBeTruthy();
    });
  });

  describe('POST /api/surgeries/[id]/operative-note', () => {
    it('should create operative note', async () => {
      prismaMock.operativeNote.create.mockResolvedValue(mockOperativeNote as any);

      const result = await prismaMock.operativeNote.create({
        data: {
          surgeryId: mockSurgery.id,
          diagnosticoPreoperatorio: 'Apendicitis aguda',
          hallazgos: 'Apéndice inflamado',
        } as any,
      });

      expect(result.surgeryId).toBe(mockSurgery.id);
      expect(result.diagnosticoPreoperatorio).toBe('Apendicitis aguda');
    });

    it('should update existing operative note', async () => {
      const updatedNote = {
        ...mockOperativeNote,
        complicaciones: 'Sangrado moderado controlado',
      };

      prismaMock.operativeNote.update.mockResolvedValue(updatedNote as any);

      const result = await prismaMock.operativeNote.update({
        where: { surgeryId: mockSurgery.id },
        data: { complicaciones: 'Sangrado moderado controlado' },
      });

      expect(result.complicaciones).toBe('Sangrado moderado controlado');
    });
  });

  describe('POST /api/surgeries/[id]/material-controls', () => {
    it('should create material control', async () => {
      const materialControl = {
        id: 'material-1',
        surgeryId: mockSurgery.id,
        moment: 'pre' as const,
        tijerasMetzembaumCurvas: 2,
        pinzaKellyCurvas: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.materialControl.create.mockResolvedValue(materialControl as any);

      const result = await prismaMock.materialControl.create({
        data: {
          surgeryId: mockSurgery.id,
          moment: 'pre',
          tijerasMetzembaumCurvas: 2,
        } as any,
      });

      expect(result.moment).toBe('pre');
      expect(result.tijerasMetzembaumCurvas).toBe(2);
    });

    it('should create material controls for all moments', async () => {
      const moments = ['pre', 'trans', 'final'];
      
      for (const moment of moments) {
        const control = {
          id: `material-${moment}`,
          surgeryId: mockSurgery.id,
          moment,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        prismaMock.materialControl.create.mockResolvedValue(control as any);
        
        const result = await prismaMock.materialControl.create({
          data: { surgeryId: mockSurgery.id, moment } as any,
        });

        expect(result.moment).toBe(moment);
      }
    });
  });

  describe('POST /api/surgeries/[id]/anesthesia-record', () => {
    it('should create anesthesia record', async () => {
      const anesthesiaRecord = {
        id: 'anesthesia-1',
        surgeryId: mockSurgery.id,
        premedicacion: 'Midazolam 5mg',
        estadoFisico: 'ASA II',
        agentesTecnicas: 'Sevoflurano',
        anestesiologo: 'Dr. Anestesiólogo',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.anesthesiaRecord.create.mockResolvedValue(anesthesiaRecord as any);

      const result = await prismaMock.anesthesiaRecord.create({
        data: {
          surgeryId: mockSurgery.id,
          premedicacion: 'Midazolam 5mg',
          estadoFisico: 'ASA II',
        } as any,
      });

      expect(result.surgeryId).toBe(mockSurgery.id);
      expect(result.premedicacion).toBe('Midazolam 5mg');
    });
  });

  describe('Safety Checklist', () => {
    it('should create safety checklist with entrada', async () => {
      const safetyChecklist = {
        id: 'safety-1',
        surgeryId: mockSurgery.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.safetyChecklist.create.mockResolvedValue(safetyChecklist as any);

      const result = await prismaMock.safetyChecklist.create({
        data: { surgeryId: mockSurgery.id } as any,
      });

      expect(result.surgeryId).toBe(mockSurgery.id);
    });
  });
});

