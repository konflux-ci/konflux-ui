import { parseBoolean, parseNumber } from '../common-utils';

describe('parseBoolean', () => {
  it('should return defaultValue when value is undefined', () => {
    expect(parseBoolean(undefined, true)).toBe(true);
    expect(parseBoolean(undefined, false)).toBe(false);
  });

  it('should return defaultValue when value is empty string', () => {
    expect(parseBoolean('', true)).toBe(true);
    expect(parseBoolean('', false)).toBe(false);
  });

  it('should return true for "true" (case insensitive)', () => {
    expect(parseBoolean('true', false)).toBe(true);
    expect(parseBoolean('TRUE', false)).toBe(true);
    expect(parseBoolean('True', false)).toBe(true);
    expect(parseBoolean('TrUe', false)).toBe(true);
  });

  it('should return false for "false"', () => {
    expect(parseBoolean('false', true)).toBe(false);
    expect(parseBoolean('FALSE', true)).toBe(false);
  });

  it('should return false for any non-"true" string', () => {
    expect(parseBoolean('yes', true)).toBe(false);
    expect(parseBoolean('1', true)).toBe(false);
    expect(parseBoolean('invalid', true)).toBe(false);
  });
});

describe('parseNumber', () => {
  it('should return defaultValue when value is undefined', () => {
    expect(parseNumber(undefined, 10)).toBe(10);
    expect(parseNumber(undefined, 0)).toBe(0);
  });

  it('should return defaultValue when value is empty string', () => {
    expect(parseNumber('', 5.5)).toBe(5.5);
  });

  it('should parse valid integer strings', () => {
    expect(parseNumber('42', 0)).toBe(42);
    expect(parseNumber('0', 10)).toBe(0);
    expect(parseNumber('-5', 0)).toBe(-5);
  });

  it('should parse valid float strings', () => {
    expect(parseNumber('3.14', 0)).toBe(3.14);
    expect(parseNumber('0.5', 0)).toBe(0.5);
    expect(parseNumber('-2.5', 0)).toBe(-2.5);
  });

  it('should return defaultValue for invalid number strings', () => {
    expect(parseNumber('invalid', 99)).toBe(99);
    expect(parseNumber('abc123', 1)).toBe(1);
    expect(parseNumber('NaN', 0)).toBe(0);
  });
});
