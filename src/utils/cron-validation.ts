import cronValidate from 'cron-validate';

// More comprehensive cron expression pattern for client-side validation
export const CRON_PATTERN =
  /^(\*|[0-9]{1,2}(-[0-9]{1,2})?(,[0-9]{1,2}(-[0-9]{1,2})?)*|\*\/[0-9]{1,2})(\s+(\*|[0-9]{1,2}(-[0-9]{1,2})?(,[0-9]{1,2}(-[0-9]{1,2})?)*|\*\/[0-9]{1,2})){4}$/;

// Sanitize cron expression input - clean whitespace but preserve structure
export const sanitizeCronInput = (input: string): string => {
  // Handle empty or whitespace-only input
  if (!input || !input.trim()) {
    return '';
  }

  // Replace multiple whitespace characters (including tabs, newlines, unicode spaces) with single spaces
  // Then trim leading/trailing whitespace
  return input.replace(/[\s\u00A0\u200B\u2003\u2002\u2009\u2028\u2029\t\n\r\f\v]+/g, ' ').trim();
};

// Validate cron expression - returns boolean for backward compatibility
export const validateCronExpression = (cronExpression: string): boolean => {
  // Sanitize input first - normalize whitespace
  const normalized = sanitizeCronInput(cronExpression);

  if (!normalized) {
    return false;
  }

  // Split into parts and check basic structure
  const parts = normalized.split(' ');
  if (parts.length !== 5) {
    return false;
  }

  // Use cron-validate for thorough validation
  const validationResult = cronValidate(normalized, {
    preset: 'default',
    override: {
      useSeconds: false,
      useYears: false,
      useAliases: true, // Allow MON, TUE, JAN, etc.
      useBlankDay: false,
      allowOnlyOneBlankDayField: false,
      mustHaveBlankDayField: false,
      useLastDayOfMonth: false,
      useLastDayOfWeek: false,
      useNearestWeekday: false,
      useNthWeekdayOfMonth: false,
    },
  });

  return validationResult.isValid();
};
