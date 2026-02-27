import { normalizeValueToString } from '../utils';

describe('normalizeValueToString', () => {
  it('should return empty string for null', () => {
    expect(normalizeValueToString(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(normalizeValueToString(undefined)).toBe('');
  });

  it('should return empty string for empty array', () => {
    expect(normalizeValueToString([])).toBe('');
  });

  it('should return comma-separated string for array of primitives', () => {
    expect(normalizeValueToString(['a', 'b'])).toBe('a, b');
    expect(normalizeValueToString([1, 2, 3])).toBe('1, 2, 3');
  });

  it('should stringify array elements with String()', () => {
    expect(normalizeValueToString(['x', null, undefined])).toBe('x, null, undefined');
  });

  it('should return JSON string for plain objects', () => {
    expect(normalizeValueToString({ key: 'value', count: 1 })).toBe('{"key":"value","count":1}');
  });

  it('should return JSON string for nested objects', () => {
    expect(normalizeValueToString({ a: { b: 2 } })).toBe('{"a":{"b":2}}');
  });

  it('should return string as-is via String()', () => {
    expect(normalizeValueToString('hello')).toBe('hello');
    expect(normalizeValueToString('')).toBe('');
  });

  it('should convert number to string', () => {
    expect(normalizeValueToString(42)).toBe('42');
    expect(normalizeValueToString(0)).toBe('0');
  });

  it('should convert boolean to string', () => {
    expect(normalizeValueToString(true)).toBe('true');
    expect(normalizeValueToString(false)).toBe('false');
  });
});
