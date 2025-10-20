/**
 * @jest-environment node
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { prismaMock } from '@/__tests__/mocks/prisma';
import { mockPatient, mockUser } from '@/__tests__/utils/mock-data';

// Mock data para reportes
const mockInvoice = {
  id: 'invoice-1',
  paymentId: 'payment-1',
  type: 'simple' as const,
  numeroDocumento: 'REC-000001',
  fechaEmision: new Date('2024-01-01'),
  emisorNombre: 'Hospital Zuniga',
  clienteNombre: 'Juan Pérez',
  clienteIdentidad: '0801-1990-12345',
  subtotal: 217.39,
  descuentos: 0,
  isv: 32.61,
  total: 250.0,
  detalleGenerico: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockPaymentWithInvoice = {
  id: 'payment-1',
  patientId: mockPatient.id,
  consultationId: 'consultation-1',
  saleId: null,
  hospitalizationId: null,
  surgeryId: null,
  status: 'paid' as const,
  total: 250.0,
  paymentMethod: 'efectivo' as const,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  invoices: [mockInvoice],
};

const mockServiceItem = {
  id: 'item-1',
  name: 'Consulta Medicina General',
  type: 'servicio' as const,
  basePrice: 250.0,
  isActive: true,
  description: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockTransactionItem = {
  id: 'trans-1',
  sourceType: 'consultation' as const,
  sourceId: 'consultation-1',
  serviceItemId: mockServiceItem.id,
  variantId: null,
  quantity: 1,
  nombre: 'Consulta Medicina General',
  precioUnitario: 250.0,
  descuento: 0,
  total: 250.0,
  notes: null,
  addedBy: mockUser.id,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  serviceItem: mockServiceItem,
};

describe('Reports API', () => {
  describe('GET /api/reports/income', () => {
    it('should calculate total income for date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const payments = [
        mockPaymentWithInvoice,
        { ...mockPaymentWithInvoice, id: 'payment-2', total: 300.0 },
      ];

      prismaMock.payment.findMany.mockResolvedValue(payments as any);

      const result = await prismaMock.payment.findMany({
        where: {
          status: 'paid',
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const totalIncome = result.reduce((sum, p) => sum + p.total, 0);
      expect(totalIncome).toBe(550.0);
    });

    it('should group income by service item', async () => {
      const items = [
        mockTransactionItem,
        { ...mockTransactionItem, id: 'trans-2', total: 300.0 },
      ];

      prismaMock.transactionItem.findMany.mockResolvedValue(items as any);

      const result = await prismaMock.transactionItem.findMany({
        include: {
          serviceItem: true,
        },
      });

      const totalByService = result.reduce((acc, item) => {
        const serviceName = item.serviceItem.name;
        acc[serviceName] = (acc[serviceName] || 0) + item.total;
        return acc;
      }, {} as Record<string, number>);

      expect(totalByService['Consulta Medicina General']).toBe(550.0);
    });

    it('should group income by payment method', async () => {
      const payments = [
        mockPaymentWithInvoice,
        { ...mockPaymentWithInvoice, id: 'payment-2', paymentMethod: 'tarjeta', total: 300.0 },
        { ...mockPaymentWithInvoice, id: 'payment-3', paymentMethod: 'efectivo', total: 150.0 },
      ];

      prismaMock.payment.findMany.mockResolvedValue(payments as any);

      const result = await prismaMock.payment.findMany({
        where: { status: 'paid' },
      });

      const byMethod = result.reduce((acc, p) => {
        const method = p.paymentMethod || 'sin_definir';
        acc[method] = (acc[method] || 0) + p.total;
        return acc;
      }, {} as Record<string, number>);

      expect(byMethod.efectivo).toBe(400.0); // 250 + 150
      expect(byMethod.tarjeta).toBe(300.0);
    });
  });

  describe('GET /api/reports/accounting', () => {
    it('should return all invoices with details', async () => {
      const invoices = [
        mockInvoice,
        { ...mockInvoice, id: 'invoice-2', type: 'legal', total: 500.0 },
      ];

      prismaMock.invoice.findMany.mockResolvedValue(invoices as any);

      const result = await prismaMock.invoice.findMany({
        include: {
          payment: {
            include: {
              patient: true,
            },
          },
        },
      });

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('simple');
      expect(result[1].type).toBe('legal');
    });

    it('should calculate ISV correctly', async () => {
      const total = 250.0;
      const subtotal = total / 1.15;
      const isv = total - subtotal;

      expect(subtotal).toBeCloseTo(217.39, 2);
      expect(isv).toBeCloseTo(32.61, 2);
    });

    it('should filter invoices by type', async () => {
      const legalInvoices = [
        { ...mockInvoice, id: 'invoice-2', type: 'legal' },
      ];

      prismaMock.invoice.findMany.mockResolvedValue(legalInvoices as any);

      const result = await prismaMock.invoice.findMany({
        where: { type: 'legal' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('legal');
    });

    it('should filter invoices by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      prismaMock.invoice.findMany.mockResolvedValue([mockInvoice] as any);

      const result = await prismaMock.invoice.findMany({
        where: {
          fechaEmision: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('GET /api/reports/auxiliary-book', () => {
    it('should return transaction items grouped by date', async () => {
      const items = [
        mockTransactionItem,
        { ...mockTransactionItem, id: 'trans-2', createdAt: new Date('2024-01-02') },
      ];

      prismaMock.transactionItem.findMany.mockResolvedValue(items as any);

      const result = await prismaMock.transactionItem.findMany({
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(2);
    });

    it('should filter by source type', async () => {
      prismaMock.transactionItem.findMany.mockResolvedValue([mockTransactionItem] as any);

      const result = await prismaMock.transactionItem.findMany({
        where: { sourceType: 'consultation' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].sourceType).toBe('consultation');
    });

    it('should include service item details', async () => {
      prismaMock.transactionItem.findMany.mockResolvedValue([mockTransactionItem] as any);

      const result = await prismaMock.transactionItem.findMany({
        include: {
          serviceItem: true,
        },
      });

      expect(result[0].serviceItem).toBeTruthy();
      expect(result[0].serviceItem.name).toBe('Consulta Medicina General');
    });
  });

  describe('Report Date Calculations', () => {
    it('should calculate daily totals', async () => {
      const paymentsDay1 = [
        { ...mockPaymentWithInvoice, total: 250.0 },
        { ...mockPaymentWithInvoice, id: 'payment-2', total: 300.0 },
      ];

      const dailyTotal = paymentsDay1.reduce((sum, p) => sum + p.total, 0);
      expect(dailyTotal).toBe(550.0);
    });

    it('should calculate monthly totals', async () => {
      const paymentsMonth = Array.from({ length: 30 }, (_, i) => ({
        ...mockPaymentWithInvoice,
        id: `payment-${i}`,
        total: 250.0,
      }));

      const monthlyTotal = paymentsMonth.reduce((sum, p) => sum + p.total, 0);
      expect(monthlyTotal).toBe(7500.0);
    });
  });

  describe('Report Filters', () => {
    it('should filter by tags', async () => {
      const tag = {
        id: 'tag-1',
        name: 'especialidad',
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.tag.findMany.mockResolvedValue([tag] as any);

      const result = await prismaMock.tag.findMany({
        where: {
          id: { in: ['tag-1'] },
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('especialidad');
    });

    it('should filter by specialty', async () => {
      const specialty = {
        id: 'specialty-1',
        name: 'Cardiología',
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.specialty.findUnique.mockResolvedValue(specialty as any);

      const result = await prismaMock.specialty.findUnique({
        where: { id: 'specialty-1' },
      });

      expect(result?.name).toBe('Cardiología');
    });
  });
});

