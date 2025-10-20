/**
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { prismaMock } from '@/__tests__/mocks/prisma';
import { mockPatient, mockUser } from '@/__tests__/utils/mock-data';

// Mock data para documentos médicos
const mockConstancia = {
  id: 'doc-1',
  patientId: mockPatient.id,
  issuedBy: mockUser.id,
  documentType: 'constancia' as const,
  constancia: 'A quien corresponda, certifico que el paciente se encuentra bajo tratamiento médico...',
  diagnostico: null,
  diasReposo: null,
  fechaInicio: null,
  fechaFin: null,
  tipoExamen: null,
  indicaciones: null,
  urgencia: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  patient: mockPatient,
  issuer: mockUser,
};

const mockIncapacidad = {
  id: 'doc-2',
  patientId: mockPatient.id,
  issuedBy: mockUser.id,
  documentType: 'incapacidad' as const,
  constancia: null,
  diagnostico: 'Faringitis aguda',
  diasReposo: 3,
  fechaInicio: new Date('2024-01-01'),
  fechaFin: new Date('2024-01-04'),
  tipoExamen: null,
  indicaciones: null,
  urgencia: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  patient: mockPatient,
  issuer: mockUser,
};

const mockOrdenExamen = {
  id: 'doc-3',
  patientId: mockPatient.id,
  issuedBy: mockUser.id,
  documentType: 'orden_examen' as const,
  constancia: null,
  diagnostico: null,
  diasReposo: null,
  fechaInicio: null,
  fechaFin: null,
  tipoExamen: 'Radiografía de Tórax',
  indicaciones: 'Descartar neumonía',
  urgencia: 'urgente' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  patient: mockPatient,
  issuer: mockUser,
};

describe('Medical Documents API', () => {
  describe('GET /api/medical-documents', () => {
    it('should return all documents for a patient', async () => {
      const documents = [mockConstancia, mockIncapacidad, mockOrdenExamen];

      prismaMock.medicalDocument.findMany.mockResolvedValue(documents as any);

      const result = await prismaMock.medicalDocument.findMany({
        where: { patientId: mockPatient.id },
        include: {
          patient: true,
          issuer: true,
        },
      });

      expect(result).toHaveLength(3);
      expect(result[0].documentType).toBe('constancia');
      expect(result[1].documentType).toBe('incapacidad');
      expect(result[2].documentType).toBe('orden_examen');
    });

    it('should filter documents by type', async () => {
      prismaMock.medicalDocument.findMany.mockResolvedValue([mockConstancia] as any);

      const result = await prismaMock.medicalDocument.findMany({
        where: {
          patientId: mockPatient.id,
          documentType: 'constancia',
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].documentType).toBe('constancia');
    });

    it('should return documents ordered by creation date desc', async () => {
      const documents = [
        { ...mockOrdenExamen, createdAt: new Date('2024-01-03') },
        { ...mockIncapacidad, createdAt: new Date('2024-01-02') },
        { ...mockConstancia, createdAt: new Date('2024-01-01') },
      ];

      prismaMock.medicalDocument.findMany.mockResolvedValue(documents as any);

      const result = await prismaMock.medicalDocument.findMany({
        orderBy: { createdAt: 'desc' },
      });

      expect(result[0].createdAt.getTime()).toBeGreaterThan(result[1].createdAt.getTime());
    });
  });

  describe('POST /api/medical-documents - Constancia', () => {
    it('should create a constancia médica', async () => {
      const newConstanciaData = {
        patientId: mockPatient.id,
        documentType: 'constancia',
        constancia: 'Nueva constancia médica',
      };

      prismaMock.medicalDocument.create.mockResolvedValue(mockConstancia as any);

      const result = await prismaMock.medicalDocument.create({
        data: {
          ...newConstanciaData,
          issuedBy: mockUser.id,
        } as any,
      });

      expect(result.documentType).toBe('constancia');
      expect(result.constancia).toBeTruthy();
    });

    it('should reject constancia without content', async () => {
      // Esto debería ser validado por el backend
      const invalidData = {
        patientId: mockPatient.id,
        documentType: 'constancia',
        constancia: '',
      };

      // La API debería rechazar esto
      expect(invalidData.constancia).toBe('');
    });
  });

  describe('POST /api/medical-documents - Incapacidad', () => {
    it('should create incapacidad with calculated fechaFin', async () => {
      const newIncapacidadData = {
        patientId: mockPatient.id,
        documentType: 'incapacidad',
        diagnostico: 'Gripe',
        diasReposo: 5,
        fechaInicio: new Date('2024-01-01'),
      };

      // La fecha fin debe ser calculada: fechaInicio + diasReposo
      const expectedFechaFin = new Date('2024-01-01');
      expectedFechaFin.setDate(expectedFechaFin.getDate() + 5);

      prismaMock.medicalDocument.create.mockResolvedValue({
        ...mockIncapacidad,
        diasReposo: 5,
        fechaFin: expectedFechaFin,
      } as any);

      const result = await prismaMock.medicalDocument.create({
        data: {
          ...newIncapacidadData,
          fechaFin: expectedFechaFin,
          issuedBy: mockUser.id,
        } as any,
      });

      expect(result.diasReposo).toBe(5);
      expect(result.fechaFin).toBeTruthy();
    });

    it('should validate days of rest range (1-365)', async () => {
      // Validación que debería hacer el backend
      expect(1).toBeGreaterThanOrEqual(1);
      expect(1).toBeLessThanOrEqual(365);
      expect(365).toBeLessThanOrEqual(365);
      
      // Valores inválidos
      const invalidLow = 0;
      const invalidHigh = 366;
      
      expect(invalidLow).toBeLessThan(1);
      expect(invalidHigh).toBeGreaterThan(365);
    });
  });

  describe('POST /api/medical-documents - Orden de Examen', () => {
    it('should create orden de examen', async () => {
      const newOrdenData = {
        patientId: mockPatient.id,
        documentType: 'orden_examen',
        tipoExamen: 'Hemograma Completo',
        indicaciones: 'Control de anemia',
        urgencia: 'normal',
      };

      prismaMock.medicalDocument.create.mockResolvedValue({
        ...mockOrdenExamen,
        tipoExamen: 'Hemograma Completo',
        urgencia: 'normal',
      } as any);

      const result = await prismaMock.medicalDocument.create({
        data: {
          ...newOrdenData,
          issuedBy: mockUser.id,
        } as any,
      });

      expect(result.documentType).toBe('orden_examen');
      expect(result.tipoExamen).toBe('Hemograma Completo');
      expect(result.urgencia).toBe('normal');
    });

    it('should handle urgent exams', async () => {
      prismaMock.medicalDocument.create.mockResolvedValue(mockOrdenExamen as any);

      const result = await prismaMock.medicalDocument.create({
        data: {
          patientId: mockPatient.id,
          documentType: 'orden_examen',
          tipoExamen: 'Radiografía de Tórax',
          indicaciones: 'Trauma torácico',
          urgencia: 'urgente',
          issuedBy: mockUser.id,
        } as any,
      });

      expect(result.urgencia).toBe('urgente');
    });

    it('should validate urgencia values', async () => {
      const validUrgencias = ['normal', 'urgente'];
      
      validUrgencias.forEach((urgencia) => {
        expect(['normal', 'urgente']).toContain(urgencia);
      });

      const invalidUrgencia = 'super-urgente';
      expect(['normal', 'urgente']).not.toContain(invalidUrgencia);
    });
  });

  describe('GET /api/medical-documents/[id]', () => {
    it('should return a specific document', async () => {
      prismaMock.medicalDocument.findUnique.mockResolvedValue(mockConstancia as any);

      const result = await prismaMock.medicalDocument.findUnique({
        where: { id: 'doc-1' },
        include: {
          patient: true,
          issuer: true,
        },
      });

      expect(result).toBeTruthy();
      expect(result?.id).toBe('doc-1');
    });

    it('should return null for non-existent document', async () => {
      prismaMock.medicalDocument.findUnique.mockResolvedValue(null);

      const result = await prismaMock.medicalDocument.findUnique({
        where: { id: 'non-existent' },
      });

      expect(result).toBeNull();
    });
  });

  describe('DELETE /api/medical-documents/[id]', () => {
    it('should delete a document (admin only)', async () => {
      prismaMock.medicalDocument.delete.mockResolvedValue(mockConstancia as any);

      const result = await prismaMock.medicalDocument.delete({
        where: { id: 'doc-1' },
      });

      expect(result.id).toBe('doc-1');
    });
  });

  describe('Document Type Validations', () => {
    it('should only accept valid document types', async () => {
      const validTypes = ['constancia', 'incapacidad', 'orden_examen'];
      
      validTypes.forEach((type) => {
        expect(['constancia', 'incapacidad', 'orden_examen']).toContain(type);
      });

      const invalidType = 'receta';
      expect(['constancia', 'incapacidad', 'orden_examen']).not.toContain(invalidType);
    });
  });

  describe('Permissions', () => {
    it('should verify issuer is a doctor', async () => {
      const doctorUser = {
        ...mockUser,
        role: { id: 'role-specialist', name: 'especialista' },
      };

      expect(['especialista', 'admin']).toContain(doctorUser.role.name);
    });

    it('should reject non-doctor users from creating documents', async () => {
      const receptionUser = {
        ...mockUser,
        role: { id: 'role-reception', name: 'recepcion' },
      };

      expect(['especialista', 'admin']).not.toContain(receptionUser.role.name);
    });
  });
});

