import { formatDateTime, formatPhone, formatCurrency } from '../formatters';

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
});

