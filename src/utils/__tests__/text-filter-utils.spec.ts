import { textMatch, filterByText, TextFilterOptions } from '~/utils/text-filter-utils';

describe('textMatch', () => {
  describe('default options', () => {
    it('should match a substring case-insensitively', () => {
      expect(textMatch('Hello World', 'hello')).toBe(true);
      expect(textMatch('Hello World', 'WORLD')).toBe(true);
      expect(textMatch('Hello World', 'lo Wo')).toBe(true);
    });

    it('should return false when the substring is not present', () => {
      expect(textMatch('Hello World', 'xyz')).toBe(false);
    });

    it('should trim the search term by default', () => {
      expect(textMatch('Hello', '  hello  ')).toBe(true);
    });

    it('should match everything when the search term is empty', () => {
      expect(textMatch('anything', '')).toBe(true);
    });

    it('should match everything when the search term is only whitespace (trimmed to empty)', () => {
      expect(textMatch('anything', '   ')).toBe(true);
    });
  });

  describe('non-string value handling', () => {
    it('should coerce a number value to a string', () => {
      expect(textMatch(42, '4')).toBe(true);
      expect(textMatch(42, '42')).toBe(true);
      expect(textMatch(42, '99')).toBe(false);
    });

    it('should handle null value gracefully', () => {
      expect(textMatch(null, 'search')).toBe(false);
      expect(textMatch(null, '')).toBe(true);
    });

    it('should handle undefined value gracefully', () => {
      expect(textMatch(undefined, 'search')).toBe(false);
      expect(textMatch(undefined, '')).toBe(true);
    });

    it('should coerce boolean values to strings', () => {
      expect(textMatch(true, 'true')).toBe(true);
      expect(textMatch(false, 'fal')).toBe(true);
    });

    it('should handle zero as a value', () => {
      expect(textMatch(0, '0')).toBe(true);
    });
  });

  describe('caseSensitive option', () => {
    const opts: TextFilterOptions = { caseSensitive: true };

    it('should match when case matches exactly', () => {
      expect(textMatch('Hello World', 'Hello', opts)).toBe(true);
    });

    it('should not match when case differs', () => {
      expect(textMatch('Hello World', 'hello', opts)).toBe(false);
    });
  });

  describe('trim option', () => {
    it('should not trim the search term when trim is disabled', () => {
      // ' hello' (with leading space) is not a substring of 'hello world'
      expect(textMatch('hello world', ' hello', { trim: false })).toBe(false);
    });

    it('should keep leading/trailing spaces significant when trim is disabled', () => {
      expect(textMatch('  hello  ', '  hello  ', { trim: false })).toBe(true);
    });
  });

  describe('fuzzy option (subsequence)', () => {
    const opts: TextFilterOptions = { fuzzy: true };

    it('should match when characters appear in order', () => {
      expect(textMatch('Hello World', 'hwd', opts)).toBe(true);
      expect(textMatch('component-build-pipeline', 'cbp', opts)).toBe(true);
    });

    it('should not match when characters are out of order', () => {
      expect(textMatch('Hello World', 'dwh', opts)).toBe(false);
    });

    it('should still match contiguous substrings', () => {
      expect(textMatch('Hello World', 'hello', opts)).toBe(true);
    });

    it('should handle fuzzy match with an empty search term', () => {
      expect(textMatch('Hello', '', opts)).toBe(true);
    });

    it('should handle fuzzy match with single character', () => {
      expect(textMatch('Hello', 'h', opts)).toBe(true);
      expect(textMatch('Hello', 'z', opts)).toBe(false);
    });

    it('should not match when search term is longer than value', () => {
      expect(textMatch('Hi', 'Hello', opts)).toBe(false);
    });

    it('should be case-insensitive by default', () => {
      expect(textMatch('Hello World', 'HWD', opts)).toBe(true);
    });

    it('should respect caseSensitive with fuzzy', () => {
      expect(textMatch('Hello World', 'HW', { fuzzy: true, caseSensitive: true })).toBe(true);
      expect(textMatch('Hello World', 'hw', { fuzzy: true, caseSensitive: true })).toBe(false);
    });
  });

  describe('combined options', () => {
    it('should handle caseSensitive + trim disabled together', () => {
      expect(textMatch('Hello', ' Hello', { caseSensitive: true, trim: false })).toBe(false);
      expect(textMatch(' Hello', ' Hello', { caseSensitive: true, trim: false })).toBe(true);
    });

    it('should handle all options together', () => {
      expect(
        textMatch('Component Build Pipeline', '  cbp  ', {
          caseSensitive: false,
          trim: true,
          fuzzy: true,
        }),
      ).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should match when value and search term are identical', () => {
      expect(textMatch('exact', 'exact')).toBe(true);
    });

    it('should handle empty value with empty search term', () => {
      expect(textMatch('', '')).toBe(true);
    });

    it('should handle empty value with non-empty search term', () => {
      expect(textMatch('', 'search')).toBe(false);
    });

    it('should handle special regex characters in search term', () => {
      expect(textMatch('price is $4.99', '$4.99')).toBe(true);
      expect(textMatch('a (b) c', '(b)')).toBe(true);
      expect(textMatch('foo[0]', '[0]')).toBe(true);
    });

    it('should handle unicode characters', () => {
      expect(textMatch('café', 'café')).toBe(true);
      expect(textMatch('日本語', '本')).toBe(true);
    });
  });
});

describe('filterByText', () => {
  const items = [
    { name: 'Alpha', id: 1 },
    { name: 'Beta', id: 2 },
    { name: 'Gamma', id: 3 },
    { name: 'Delta', id: 4 },
  ];

  it('should filter items by substring match', () => {
    const result = filterByText(items, 'eta', (item) => item.name);
    expect(result).toEqual([{ name: 'Beta', id: 2 }]);
  });

  it('should return the original array reference for empty query', () => {
    const result = filterByText(items, '', (item) => item.name);
    expect(result).toBe(items);
  });

  it('should return the original array reference for whitespace-only query', () => {
    const result = filterByText(items, '   ', (item) => item.name);
    expect(result).toBe(items);
  });

  it('should return the original array reference for null/undefined query', () => {
    expect(filterByText(items, null as unknown as string, (item) => item.name)).toBe(items);
    expect(filterByText(items, undefined, (item) => item.name)).toBe(items);
  });

  it('should filter case-insensitively by default', () => {
    const result = filterByText(items, 'ALPHA', (item) => item.name);
    expect(result).toEqual([{ name: 'Alpha', id: 1 }]);
  });

  it('should support accessor converting a number to string', () => {
    const result = filterByText(items, '2', (item) => String(item.id));
    expect(result).toEqual([{ name: 'Beta', id: 2 }]);
  });

  it('should support fuzzy filtering', () => {
    const result = filterByText(items, 'gma', (item) => item.name, { fuzzy: true });
    expect(result).toEqual([{ name: 'Gamma', id: 3 }]);
  });

  it('should return an empty array when nothing matches', () => {
    const result = filterByText(items, 'zzz', (item) => item.name);
    expect(result).toEqual([]);
  });

  it('should handle an empty items array', () => {
    const result = filterByText([], 'test', (item: { name: string }) => item.name);
    expect(result).toEqual([]);
  });

  it('should pass options through to textMatch', () => {
    const result = filterByText(items, 'alpha', (item) => item.name, { caseSensitive: true });
    expect(result).toEqual([]);
  });
});
