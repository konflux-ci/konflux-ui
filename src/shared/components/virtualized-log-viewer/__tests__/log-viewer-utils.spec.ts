import { flattenTokenText, getLineMatches, isMatchCurrent } from '../log-viewer-utils';
import Prism from '../prism-log-language';

describe('log-viewer-utils', () => {
  describe('flattenTokenText', () => {
    it('should return string as-is when token is a string', () => {
      expect(flattenTokenText('hello world')).toBe('hello world');
    });

    it('should flatten simple token with string content', () => {
      const token = new Prism.Token('keyword', 'function');
      expect(flattenTokenText(token)).toBe('function');
    });

    it('should flatten token with array content', () => {
      const token = new Prism.Token('string', ['Hello', ' ', 'World']);
      expect(flattenTokenText(token)).toBe('Hello World');
    });

    it('should flatten deeply nested tokens', () => {
      const nestedToken = new Prism.Token(
        'outer',
        new Prism.Token('middle', new Prism.Token('inner', 'deep value')),
      );
      expect(flattenTokenText(nestedToken)).toBe('deep value');
    });

    it('should flatten array of mixed strings and tokens', () => {
      const complexToken = new Prism.Token('complex', [
        'start ',
        new Prism.Token('nested', 'middle'),
        ' end',
      ]);

      expect(flattenTokenText(complexToken)).toBe('start middle end');
    });

    it('should handle deeply nested array structures', () => {
      const deepArray = new Prism.Token('root', [
        'a',
        new Prism.Token('level1', ['b', new Prism.Token('level2', 'c')]),
        'd',
      ]);
      expect(flattenTokenText(deepArray)).toBe('abcd');
    });

    it('should handle empty string', () => {
      expect(flattenTokenText('')).toBe('');
    });

    it('should handle token with empty string content', () => {
      const token = new Prism.Token('empty', '');
      expect(flattenTokenText(token)).toBe('');
    });

    it('should handle token with empty array content', () => {
      const token = new Prism.Token('empty', []);
      expect(flattenTokenText(token)).toBe('');
    });
  });

  describe('getLineMatches', () => {
    it('should return empty array when regex is undefined', () => {
      expect(getLineMatches('some text', undefined)).toEqual([]);
    });

    it('should find single match in line', () => {
      const regex = /error/gi;
      const matches = getLineMatches('This is an error message', regex);

      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({ start: 11, end: 16 });
    });

    it('should find multiple matches in line', () => {
      const regex = /error/gi;
      const matches = getLineMatches('error at start, error in middle, error at end', regex);

      expect(matches).toHaveLength(3);
      expect(matches[0]).toEqual({ start: 0, end: 5 });
      expect(matches[1]).toEqual({ start: 16, end: 21 });
      expect(matches[2]).toEqual({ start: 33, end: 38 });
    });

    it('should be case insensitive with gi flag', () => {
      const regex = /error/gi;
      const matches = getLineMatches('ERROR Warning error', regex);

      expect(matches).toHaveLength(2);
      expect(matches[0]).toEqual({ start: 0, end: 5 });
      expect(matches[1]).toEqual({ start: 14, end: 19 });
    });

    it('should handle regex with special characters', () => {
      const regex = /\[error\]/gi;
      const matches = getLineMatches('[error] normal error', regex);

      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({ start: 0, end: 7 });
    });

    it('should handle empty line', () => {
      const regex = /error/gi;
      expect(getLineMatches('', regex)).toEqual([]);
    });

    it('should handle line with no matches', () => {
      const regex = /error/gi;
      expect(getLineMatches('This is a normal message', regex)).toEqual([]);
    });

    it('should handle overlapping patterns correctly', () => {
      const regex = /aa/g;
      const matches = getLineMatches('aaaa', regex);

      // Non-overlapping matches: "aa" at 0-2 and "aa" at 2-4
      expect(matches).toHaveLength(2);
      expect(matches[0]).toEqual({ start: 0, end: 2 });
      expect(matches[1]).toEqual({ start: 2, end: 4 });
    });

    it('should handle single character matches', () => {
      const regex = /a/g;
      const matches = getLineMatches('banana', regex);

      expect(matches).toHaveLength(3);
      expect(matches[0]).toEqual({ start: 1, end: 2 });
      expect(matches[1]).toEqual({ start: 3, end: 4 });
      expect(matches[2]).toEqual({ start: 5, end: 6 });
    });

    it('should handle multi-line regex flag (but still match within single line)', () => {
      const regex = /error/gim;
      const matches = getLineMatches('ERROR', regex);

      expect(matches).toHaveLength(1);
      expect(matches[0]).toEqual({ start: 0, end: 5 });
    });
  });

  describe('isMatchCurrent', () => {
    it('should return true when ranges overlap completely', () => {
      const currentMatch = { start: 5, end: 10 };
      expect(isMatchCurrent(5, 10, currentMatch)).toBe(true);
    });

    it('should return true when range is within current match', () => {
      const currentMatch = { start: 5, end: 10 };
      expect(isMatchCurrent(6, 9, currentMatch)).toBe(true);
    });

    it('should return true when range contains current match', () => {
      const currentMatch = { start: 6, end: 9 };
      expect(isMatchCurrent(5, 10, currentMatch)).toBe(true);
    });

    it('should return true when range overlaps at start', () => {
      const currentMatch = { start: 5, end: 10 };
      expect(isMatchCurrent(3, 7, currentMatch)).toBe(true);
    });

    it('should return true when range overlaps at end', () => {
      const currentMatch = { start: 5, end: 10 };
      expect(isMatchCurrent(8, 12, currentMatch)).toBe(true);
    });

    it('should return false when range is before current match', () => {
      const currentMatch = { start: 5, end: 10 };
      expect(isMatchCurrent(0, 5, currentMatch)).toBe(false);
    });

    it('should return false when range is after current match', () => {
      const currentMatch = { start: 5, end: 10 };
      expect(isMatchCurrent(10, 15, currentMatch)).toBe(false);
    });

    it('should return false when currentMatch is null', () => {
      expect(isMatchCurrent(5, 10, null)).toBe(false);
    });

    it('should handle zero-length ranges', () => {
      const currentMatch = { start: 5, end: 10 };
      // Zero-length range at position 7 (within current match) - returns true because the point is within range
      expect(isMatchCurrent(7, 7, currentMatch)).toBe(true);
      // Zero-length range outside current match
      expect(isMatchCurrent(15, 15, currentMatch)).toBe(false);
    });

    it('should handle adjacent ranges (touching but not overlapping)', () => {
      const currentMatch = { start: 5, end: 10 };
      // Range ends exactly where current match starts
      expect(isMatchCurrent(0, 5, currentMatch)).toBe(false);
      // Range starts exactly where current match ends
      expect(isMatchCurrent(10, 15, currentMatch)).toBe(false);
    });

    it('should handle ranges with single character overlap', () => {
      const currentMatch = { start: 5, end: 10 };
      // Overlap by one character at start
      expect(isMatchCurrent(4, 6, currentMatch)).toBe(true);
      // Overlap by one character at end
      expect(isMatchCurrent(9, 11, currentMatch)).toBe(true);
    });
  });
});
