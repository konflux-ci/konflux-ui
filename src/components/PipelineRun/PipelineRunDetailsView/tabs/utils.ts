export const normalizeValueToString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map(String).join(', ');
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      // JSON.stringify throws for circular references
      return '[Unserializable]';
    }
  }

  return String(value);
};
