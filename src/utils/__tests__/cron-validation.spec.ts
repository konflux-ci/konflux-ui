import { validateCronExpression, sanitizeCronInput } from '../cron-validation';

describe('Cron Validation', () => {
  describe('validateCronExpression', () => {
    describe('valid expressions', () => {
      it('should validate standard 5-part cron expressions', () => {
        expect(validateCronExpression('0 9 * * *')).toBe(true); // Daily at 9 AM
        expect(validateCronExpression('0 0 * * 0')).toBe(true); // Weekly on Sunday
        expect(validateCronExpression('*/15 * * * *')).toBe(true); // Every 15 minutes
        expect(validateCronExpression('0 0 1 * *')).toBe(true); // Monthly on 1st
        expect(validateCronExpression('0 0 1 1 *')).toBe(true); // Yearly on Jan 1st
      });

      it('should validate expressions with ranges', () => {
        expect(validateCronExpression('0 9-17 * * 1-5')).toBe(true); // Business hours
        expect(validateCronExpression('0 0 1-15 * *')).toBe(true); // First half of month
      });

      it('should validate expressions with lists', () => {
        expect(validateCronExpression('0 9,12,17 * * *')).toBe(true); // Multiple times
        expect(validateCronExpression('0 0 * * 1,3,5')).toBe(true); // Multiple days
      });

      it('should validate expressions with step values', () => {
        expect(validateCronExpression('*/5 * * * *')).toBe(true); // Every 5 minutes
        expect(validateCronExpression('0 */2 * * *')).toBe(true); // Every 2 hours
        expect(validateCronExpression('0 0 */3 * *')).toBe(true); // Every 3 days
      });
    });

    describe('invalid expressions', () => {
      it('should reject expressions with wrong number of parts', () => {
        expect(validateCronExpression('0 9 * *')).toBe(false); // 4 parts
        expect(validateCronExpression('0 9 * * * *')).toBe(false); // 6 parts
        expect(validateCronExpression('')).toBe(false); // Empty
        expect(validateCronExpression('   ')).toBe(false); // Whitespace only
      });

      it('should reject expressions with invalid field values', () => {
        expect(validateCronExpression('60 9 * * *')).toBe(false); // Invalid minute
        expect(validateCronExpression('0 24 * * *')).toBe(false); // Invalid hour
        expect(validateCronExpression('0 9 32 * *')).toBe(false); // Invalid day
        expect(validateCronExpression('0 9 * 13 *')).toBe(false); // Invalid month
        expect(validateCronExpression('0 9 * * 8')).toBe(false); // Invalid day of week
      });

      it('should reject expressions with invalid syntax', () => {
        expect(validateCronExpression('invalid cron')).toBe(false);
        expect(validateCronExpression('0 9 * * * extra')).toBe(false);
        expect(validateCronExpression('0 9-25 * * *')).toBe(false); // Invalid range
        expect(validateCronExpression('0 9/0 * * *')).toBe(false); // Division by zero
      });

      it('should reject expressions with special characters in wrong positions', () => {
        expect(validateCronExpression('? 9 * * *')).toBe(false); // Question mark in minute
        expect(validateCronExpression('0 ? * * *')).toBe(false); // Question mark in hour
        expect(validateCronExpression('0 9 L * *')).toBe(false); // L in wrong field
      });
    });

    describe('edge cases', () => {
      it('should handle expressions with extra whitespace', () => {
        expect(validateCronExpression('  0   9   *   *   *  ')).toBe(true);
        expect(validateCronExpression('\t0\t9\t*\t*\t*\t')).toBe(true);
      });

      it('should handle case sensitivity', () => {
        expect(validateCronExpression('0 9 * * MON')).toBe(true);
        expect(validateCronExpression('0 9 * JAN *')).toBe(true);
        expect(validateCronExpression('0 9 * jan *')).toBe(true);
      });
    });
  });

  describe('sanitizeCronInput', () => {
    it('should clean extra whitespace', () => {
      expect(sanitizeCronInput('  0   9   *   *   *  ')).toBe('0 9 * * *');
      expect(sanitizeCronInput('\t0\t9\t*\t*\t*\t')).toBe('0 9 * * *');
      expect(sanitizeCronInput('0    9    *    *    *')).toBe('0 9 * * *');
    });

    it('should preserve valid expressions unchanged', () => {
      expect(sanitizeCronInput('0 9 * * *')).toBe('0 9 * * *');
      expect(sanitizeCronInput('*/15 * * * *')).toBe('*/15 * * * *');
      expect(sanitizeCronInput('0 9-17 * * 1-5')).toBe('0 9-17 * * 1-5');
    });

    it('should handle empty or invalid input', () => {
      expect(sanitizeCronInput('')).toBe('');
      expect(sanitizeCronInput('   ')).toBe('');
      expect(sanitizeCronInput('\t\n\r')).toBe('');
    });

    it('should preserve special characters', () => {
      expect(sanitizeCronInput('0 9,12,17 * * *')).toBe('0 9,12,17 * * *');
      expect(sanitizeCronInput('*/5 * * * *')).toBe('*/5 * * * *');
      expect(sanitizeCronInput('0 0 1-15 * *')).toBe('0 0 1-15 * *');
    });

    it('should handle mixed whitespace types', () => {
      expect(sanitizeCronInput('0\t9 \n* \r* \t*')).toBe('0 9 * * *');
      expect(sanitizeCronInput('0\u00A0\u200B9\u2003*\u2002*\u2009*')).toBe('0 9 * * *'); // Unicode spaces
    });

    it('should not modify non-whitespace characters', () => {
      expect(sanitizeCronInput('0 9 * * * # comment')).toBe('0 9 * * * # comment');
      expect(sanitizeCronInput('invalid cron expression')).toBe('invalid cron expression');
    });
  });
}); 