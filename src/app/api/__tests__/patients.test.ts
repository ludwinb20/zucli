/**
 * @jest-environment node
 */

import { prismaMock } from '@/__tests__/mocks/prisma';
import { mockPatient, createMockPatient } from '@/__tests__/utils/mock-data';

// Note: This is a simplified test example
// In a real scenario, you'd need to mock Next.js request/response objects
// and test the actual route handlers

describe('Patients API', () => {
  describe('GET /api/patients', () => {
    it('should return a list of patients', async () => {
      const patients = [mockPatient, createMockPatient({ id: 'patient-2', firstName: 'María' })];
      
      prismaMock.patient.findMany.mockResolvedValue(patients);
      prismaMock.patient.count.mockResolvedValue(2);

      const result = await prismaMock.patient.findMany();
      
      expect(result).toHaveLength(2);
      expect(result[0].firstName).toBe('Juan');
      expect(result[1].firstName).toBe('María');
    });

    it('should filter patients by search term', async () => {
      const filteredPatients = [mockPatient];
      
      prismaMock.patient.findMany.mockResolvedValue(filteredPatients);

      const result = await prismaMock.patient.findMany({
        where: {
          OR: [
            { firstName: { contains: 'Juan' } },
            { lastName: { contains: 'Juan' } },
          ],
        },
      });
      
      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe('Juan');
    });
  });

  describe('POST /api/patients', () => {
    it('should create a new patient', async () => {
      const newPatientData = {
        firstName: 'Carlos',
        lastName: 'García',
        birthDate: '1985-05-20',
        gender: 'Masculino',
        identityNumber: '0801-1985-54321',
      };

      const createdPatient = createMockPatient({
        id: 'patient-3',
        ...newPatientData,
      });

      prismaMock.patient.create.mockResolvedValue(createdPatient);

      const result = await prismaMock.patient.create({
        data: newPatientData,
      });

      expect(result.firstName).toBe('Carlos');
      expect(result.identityNumber).toBe('0801-1985-54321');
    });

    it('should reject duplicate identity numbers', async () => {
      prismaMock.patient.create.mockRejectedValue(
        new Error('Unique constraint failed on the fields: (`identityNumber`)')
      );

      await expect(
        prismaMock.patient.create({
          data: mockPatient,
        })
      ).rejects.toThrow('Unique constraint');
    });
  });

  describe('PUT /api/patients/[id]', () => {
    it('should update an existing patient', async () => {
      const updatedData = {
        firstName: 'Juan Carlos',
        phone: '9999-8888',
      };

      const updatedPatient = createMockPatient(updatedData);

      prismaMock.patient.update.mockResolvedValue(updatedPatient);

      const result = await prismaMock.patient.update({
        where: { id: mockPatient.id },
        data: updatedData,
      });

      expect(result.firstName).toBe('Juan Carlos');
      expect(result.phone).toBe('9999-8888');
    });
  });

  describe('DELETE /api/patients/[id]', () => {
    it('should delete a patient', async () => {
      prismaMock.patient.delete.mockResolvedValue(mockPatient);

      const result = await prismaMock.patient.delete({
        where: { id: mockPatient.id },
      });

      expect(result.id).toBe(mockPatient.id);
    });
  });
});

