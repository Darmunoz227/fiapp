import { 
  parseCurrencyInput, 
  formatCurrencyCOP, 
  formatFiadoConcept, 
  formatTransactionDate 
} from './formatters';

describe('Formatters Utility (FiApp)', () => {

  describe('parseCurrencyInput', () => {
    it('should return 0 for null, undefined, or empty string', () => {
      expect(parseCurrencyInput(null)).toBe(0);
      expect(parseCurrencyInput(undefined)).toBe(0);
      expect(parseCurrencyInput('')).toBe(0);
    });

    it('should truncate decimal numbers to integers', () => {
      expect(parseCurrencyInput(1234.56)).toBe(1234);
      expect(parseCurrencyInput(0)).toBe(0);
    });

    it('should return 0 for non-finite numbers', () => {
      expect(parseCurrencyInput(Infinity)).toBe(0);
      expect(parseCurrencyInput(NaN)).toBe(0);
    });

    it('should strip currency symbols and non-numeric characters except minus', () => {
      expect(parseCurrencyInput('$1.234')).toBe(1234); 
      expect(parseCurrencyInput('-$987')).toBe(-987);  
      expect(parseCurrencyInput('1,234.56')).toBe(123456); 
    });
  });

  describe('formatCurrencyCOP', () => {
    it('should format numbers using Colombian Peso style without decimals', () => {
      expect(formatCurrencyCOP(123456)).toBe('123.456');
    });

    it('should parse strings and format them to COP', () => {
      expect(formatCurrencyCOP('$1.234.567')).toBe('1.234.567');
    });

    it('should handle invalid or null inputs gracefully by returning 0', () => {
      expect(formatCurrencyCOP(null)).toBe('0');
    });
  });

  describe('formatFiadoConcept', () => {
    it('should map the custom Spanish short month correctly', () => {
      const testDate = new Date(2026, 6, 12); 
      expect(formatFiadoConcept(testDate)).toBe('Fiado del 12 de jul');
    });

    it('should handle January correctly', () => {
      const testDate = new Date(2026, 0, 1); 
      expect(formatFiadoConcept(testDate)).toBe('Fiado del 1 de ene');
    });
  });

  describe('formatTransactionDate', () => {
    it('should format a millisecond timestamp using es-CO locale', () => {
      const timestamp = new Date('2026-07-12T15:30:00').getTime();
      const formatted = formatTransactionDate(timestamp);
      
      expect(formatted).toContain('12');
      expect(formatted).toContain('2026');
      expect(formatted).toMatch(/(15:30|3:30|03:30)/);
    });
  });
});