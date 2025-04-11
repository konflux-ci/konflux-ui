import { formatToKebabCase } from './string-utils';

describe('formatToKebabCase', () => {
  it('should convert camelCase to kebab-case', () => {
    expect(formatToKebabCase('camelCase')).toBe('camel-case');
  });

  it('should replace underscores with dashes', () => {
    expect(formatToKebabCase('snake_case')).toBe('snake-case');
  });

  it('should handle numbers correctly', () => {
    expect(formatToKebabCase('name123')).toBe('name-123');
  });

  it('should trim leading and trailing dashes', () => {
    expect(formatToKebabCase('-leadingAndTrailing-')).toBe('leading-and-trailing');
  });

  it('should replace multiple dashes with a single dash', () => {
    expect(formatToKebabCase('multiple--dashes')).toBe('multiple-dashes');
  });

  it('should handle empty strings', () => {
    expect(formatToKebabCase('')).toBe('');
  });
});
