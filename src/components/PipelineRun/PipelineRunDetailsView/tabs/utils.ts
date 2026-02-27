export const normalizeValueToString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map(String).join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};
