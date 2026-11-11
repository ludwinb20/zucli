import { formatDateTime, formatPhone, formatCurrency, formatPuntoEmision, formatNumeroFacturaLegal, normalizeNumeroDocumento } from '../formatters';

describe('Formatters', () => {
  describe('formatDateTime', () => {
    it('should format a Date object correctly', () => {
      const date = new Date('2024-12-25T10:30:00');
      const result = formatDateTime(date);
      expect(result).toContain('25');
      expect(result).toContain('12');
      expect(result).toContain('2024');
    });

    it('should format an ISO string correctly', () => {
      const dateString = '2024-12-25T10:30:00.000Z';
      const result = formatDateTime(dateString);
      expect(result).toContain('25');
      expect(result).toContain('12');
    });

    it('should handle invalid dates', () => {
      const result = formatDateTime('invalid-date');
      expect(result).toContain('Invalid');
    });
  });

  describe('formatPhone', () => {
    it('should format a phone number with 8 digits', () => {
      const result = formatPhone('98765432');
      expect(result).toBe('9876-5432');
    });

    it('should return the original if already formatted', () => {
      const result = formatPhone('9876-5432');
      expect(result).toBe('9876-5432');
    });

    it('should handle phone numbers with country code', () => {
      const result = formatPhone('+50498765432');
      expect(result).toContain('9876');
    });

    it('should return empty string for empty input', () => {
      const result = formatPhone('');
      expect(result).toBe('');
    });
  });

  describe('formatCurrency', () => {
    it('should format a number as currency', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1');
      expect(result).toContain('234');
      expect(result).toContain('56');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('should handle negative numbers', () => {
      const result = formatCurrency(-500.25);
      expect(result).toContain('500');
    });

    it('should round to 2 decimal places', () => {
      const result = formatCurrency(10.999);
      expect(result).toContain('11');
    });
  });

  describe('formatPuntoEmision', () => {
    it('rellena ceros cuando el valor llegó como entero', () => {
      expect(formatPuntoEmision(2)).toBe('002');
      expect(formatPuntoEmision('2')).toBe('002');
    });

    it('conserva un punto que ya tiene 3 dígitos', () => {
      expect(formatPuntoEmision('002')).toBe('002');
    });

    it('no altera un prefijo con establecimiento', () => {
      expect(formatPuntoEmision('000-002')).toBe('000-002');
    });
  });

  describe('formatNumeroFacturaLegal', () => {
    it('antepone el establecimiento 000 y rellena el punto y el correlativo', () => {
      expect(formatNumeroFacturaLegal(2, 15)).toBe('000-002-01-00000015');
      expect(formatNumeroFacturaLegal('002', 15)).toBe('000-002-01-00000015');
    });

    it('no duplica el establecimiento si el punto ya lo trae', () => {
      expect(formatNumeroFacturaLegal('000-002', 15)).toBe('000-002-01-00000015');
    });
  });

  describe('normalizeNumeroDocumento', () => {
    it('antepone 000 a facturas guardadas sin establecimiento', () => {
      expect(normalizeNumeroDocumento('2-01-00000015')).toBe('000-002-01-00000015');
      expect(normalizeNumeroDocumento('002-01-00000015')).toBe('000-002-01-00000015');
    });

    it('deja igual un número que ya tiene establecimiento y los recibos', () => {
      expect(normalizeNumeroDocumento('000-002-01-00000015')).toBe('000-002-01-00000015');
      expect(normalizeNumeroDocumento('REC-000001')).toBe('REC-000001');
    });
  });
});

