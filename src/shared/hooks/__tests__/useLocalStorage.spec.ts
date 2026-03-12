import { act, renderHook } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

const TEST_KEY = 'test-use-local-storage-key';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.removeItem(TEST_KEY);
  });

  function useHookWithoutInitial<T>() {
    return useLocalStorage<T>(TEST_KEY);
  }

  function useHookWithInitial<T>(initial: T) {
    return useLocalStorage<T>(TEST_KEY, initial);
  }

  describe('initial value', () => {
    it('returns undefined when key does not exist and no initialValue is provided', () => {
      function useTestHook() {
        return useHookWithoutInitial<string>();
      }
      const { result } = renderHook(useTestHook);

      const [value] = result.current;
      expect(value).toBeUndefined();
    });

    it('returns initialValue when key does not exist and initialValue is provided', () => {
      const initial = { foo: 'bar' };
      function useTestHook() {
        return useHookWithInitial(initial);
      }
      const { result } = renderHook(useTestHook);

      const [value] = result.current;
      expect(value).toEqual(initial);
    });

    it('returns parsed value from localStorage when key exists', () => {
      const stored = [1, 2, 3];
      window.localStorage.setItem(TEST_KEY, JSON.stringify(stored));

      function useTestHook() {
        return useHookWithoutInitial<number[]>();
      }
      const { result } = renderHook(useTestHook);

      const [value] = result.current;
      expect(value).toEqual(stored);
    });
  });

  describe('setValue', () => {
    it('updates returned value and persists to localStorage', () => {
      function useTestHook() {
        return useHookWithInitial('initial');
      }
      const { result } = renderHook(useTestHook);

      expect(result.current[0]).toBe('initial');

      act(() => {
        result.current[1]('updated');
      });

      expect(result.current[0]).toBe('updated');
      expect(JSON.parse(window.localStorage.getItem(TEST_KEY) ?? '')).toBe('updated');
    });

    it('supports function updater form', () => {
      function useTestHook() {
        return useHookWithInitial<number>(10);
      }
      const { result } = renderHook(useTestHook);
      const setValue = result.current[1] as (
        value: number | ((prev: number | undefined) => number),
      ) => void;

      function incrementByFive(prev: number | undefined) {
        return (prev ?? 0) + 5;
      }
      act(() => {
        setValue(incrementByFive);
      });

      expect(result.current[0]).toBe(15);
      expect(JSON.parse(window.localStorage.getItem(TEST_KEY) ?? '')).toBe(15);
    });

    it('stores objects as JSON', () => {
      function useTestHook() {
        return useHookWithoutInitial<{ count: number }>();
      }
      const { result } = renderHook(useTestHook);

      function setCount() {
        result.current[1]({ count: 42 });
      }
      act(setCount);

      expect(result.current[0]).toEqual({ count: 42 });
      expect(JSON.parse(window.localStorage.getItem(TEST_KEY) ?? '')).toEqual({
        count: 42,
      });
    });
  });

  describe('removeValue', () => {
    it('clears the key and returned value becomes undefined when no initialValue', () => {
      window.localStorage.setItem(TEST_KEY, JSON.stringify('stored'));

      function useTestHook() {
        return useHookWithoutInitial<string>();
      }
      const { result } = renderHook(useTestHook);

      expect(result.current[0]).toBe('stored');

      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toBeUndefined();
      expect(window.localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it('clears the key and returned value reverts to initialValue when provided', () => {
      const initial = 'default';
      window.localStorage.setItem(TEST_KEY, JSON.stringify('stored'));

      function useTestHook() {
        return useHookWithInitial(initial);
      }
      const { result } = renderHook(useTestHook);

      expect(result.current[0]).toBe('stored');

      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toBe(initial);
      expect(window.localStorage.getItem(TEST_KEY)).toBeNull();
    });
  });

  describe('key isolation', () => {
    it('uses the correct key for storage', () => {
      const otherKey = 'other-key';
      window.localStorage.setItem(otherKey, JSON.stringify('other'));

      function useTestHook() {
        return useHookWithoutInitial<string>();
      }
      const { result } = renderHook(useTestHook);

      expect(result.current[0]).toBeUndefined();
      expect(window.localStorage.getItem(otherKey)).toBe('"other"');

      act(() => {
        result.current[1]('mine');
      });

      expect(JSON.parse(window.localStorage.getItem(TEST_KEY) ?? '')).toBe('mine');
      expect(JSON.parse(window.localStorage.getItem(otherKey) ?? '')).toBe('other');
    });
  });
});
