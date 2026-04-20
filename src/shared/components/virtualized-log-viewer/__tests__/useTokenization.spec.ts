import { renderHook } from '@testing-library/react';
import { MONSTER_LINE_THRESHOLD, useTokenization } from '../useTokenization';
describe('useTokenization', () => {
  describe('Tiered Highlighting Logic', () => {
    it('should tokenize normal lines using real Prism syntax', () => {
      // Use a string that we know will trigger Prism tokens (e.g., containing ':')
      const shortLine = 'INFO: Application started';

      const { result } = renderHook(() => useTokenization([shortLine]));
      const tokenized = result.current.tokenizeLine(0);

      expect(tokenized?.text).toBe(shortLine);
      // Real Prism should return multiple tokens for this string
      expect(tokenized?.tokens.length).toBeGreaterThan(0);
      expect(typeof tokenized?.tokens[0]).not.toBe('undefined');
    });

    it.each([
      [`exactly at threshold (${MONSTER_LINE_THRESHOLD / 1024}KB)`, MONSTER_LINE_THRESHOLD],
      [`well above threshold (${100}KB)`, 100 * 1024],
    ])('should bypass tokenization for lines that are %s', (_, length) => {
      const monsterLine = 'A'.repeat(length);
      const { result } = renderHook(() => useTokenization([monsterLine]));

      const tokenized = result.current.tokenizeLine(0);

      expect(tokenized?.text).toBe(monsterLine);
      // For monster lines, tokens must be an empty array as per our logic
      expect(tokenized?.tokens).toEqual([]);
    });

    it(`should still tokenize lines just under the threshold (${MONSTER_LINE_THRESHOLD / 1024}KB)`, () => {
      const nearLimitLine = 'C'.repeat(MONSTER_LINE_THRESHOLD - 1);
      const { result } = renderHook(() => useTokenization([nearLimitLine]));

      const tokenized = result.current.tokenizeLine(0);

      expect(tokenized?.text).toBe(nearLimitLine);
      // Since it's below the threshold, it should still go through Prism
      // Prism must return non-empty tokens (even if just one string token)
      expect(tokenized?.tokens).not.toEqual([]);
      expect(tokenized?.tokens.length).toBeGreaterThan(0);
    });
  });

  describe('Caching and Stability', () => {
    it('should return stable object references from cache', () => {
      const lines = ['INFO: Stable line'];
      const { result } = renderHook(() => useTokenization(lines));

      const firstCall = result.current.tokenizeLine(0);
      const secondCall = result.current.tokenizeLine(0);

      // Verify Object.is equality - the cache should return the exact same object
      expect(firstCall).toBe(secondCall);
    });

    it('should refresh cache when the lines array reference changes', () => {
      const initialLines = ['Line A'];
      const updatedLines = ['Line B'];

      const { result, rerender } = renderHook(({ lines }) => useTokenization(lines), {
        initialProps: { lines: initialLines },
      });

      const firstResult = result.current.tokenizeLine(0);
      expect(firstResult?.text).toBe('Line A');

      // Re-render with a completely new array reference
      rerender({ lines: updatedLines });

      const secondResult = result.current.tokenizeLine(0);

      expect(secondResult?.text).toBe('Line B');
      // The old object should be gone
      expect(firstResult).not.toBe(secondResult);
    });
  });

  describe('Resilience', () => {
    it('should handle invalid line indices by returning empty results', () => {
      const { result } = renderHook(() => useTokenization(['Single line']));

      expect(result.current.tokenizeLine(999)).toEqual({ tokens: [], text: '' });
      expect(result.current.tokenizeLine(-1)).toEqual({ tokens: [], text: '' });
    });

    it('should render empty strings without tokens', () => {
      const { result } = renderHook(() => useTokenization(['']));
      const tokenized = result.current.tokenizeLine(0);

      expect(tokenized?.text).toBe('');
      expect(tokenized?.tokens).toEqual([]);
    });
  });
});
