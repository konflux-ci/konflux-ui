import { act, renderHook } from '@testing-library/react';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { LOG_WRAP_LINES_STORAGE_KEY, useLineWrap } from '../useLineWrap';

jest.mock('~/shared/hooks/useLocalStorage', () => ({
  useLocalStorage: jest.fn(),
}));

const mockUseLocalStorage = useLocalStorage as jest.Mock;

describe('useLineWrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.removeItem(LOG_WRAP_LINES_STORAGE_KEY);
  });

  it('defaults to wrap enabled when localStorage is empty', () => {
    mockUseLocalStorage.mockImplementation((key: string, initialValue: boolean) => {
      const raw = window.localStorage.getItem(key);
      const value = raw === null ? initialValue : JSON.parse(raw);
      return [value, jest.fn(), jest.fn()];
    });

    const { result } = renderHook(() => useLineWrap());

    expect(result.current[0]).toBe(true);
  });

  it('returns stored preference when localStorage has a value', () => {
    window.localStorage.setItem(LOG_WRAP_LINES_STORAGE_KEY, JSON.stringify(false));
    mockUseLocalStorage.mockImplementation((key: string, initialValue: boolean) => {
      const raw = window.localStorage.getItem(key);
      const value = raw === null ? initialValue : JSON.parse(raw);
      return [value, jest.fn(), jest.fn()];
    });

    const { result } = renderHook(() => useLineWrap());

    expect(result.current[0]).toBe(false);
  });

  it('falls back to true when stored value is undefined', () => {
    mockUseLocalStorage.mockReturnValue([undefined, jest.fn(), jest.fn()]);

    const { result } = renderHook(() => useLineWrap());

    expect(result.current[0]).toBe(true);
  });

  it('updates preference via setter', () => {
    const setWrapLines = jest.fn();
    mockUseLocalStorage.mockReturnValue([true, setWrapLines, jest.fn()]);

    const { result } = renderHook(() => useLineWrap());

    act(() => {
      result.current[1](false);
    });

    expect(setWrapLines).toHaveBeenCalledWith(false);
  });
});
