import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { useLogViewerWrap } from '../useLogViewerWrap';

const LOG_WRAP_STORAGE_KEY = 'konflux-logs-wrap-preference';

jest.mock('~/shared/hooks/useLocalStorage', () => ({
  useLocalStorage: jest.fn(),
}));

const mockUseLocalStorage = useLocalStorage as jest.Mock;

describe('useLogViewerWrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.removeItem(LOG_WRAP_STORAGE_KEY);
  });

  it('returns true when localStorage is empty', () => {
    mockUseLocalStorage.mockImplementation((_key: string, initialValue: boolean) => [
      initialValue,
      jest.fn(),
      jest.fn(),
    ]);

    const { result } = renderHook(() => useLogViewerWrap());

    expect(result.current[0]).toBe(true);
    expect(mockUseLocalStorage).toHaveBeenCalledWith(LOG_WRAP_STORAGE_KEY, true);
  });

  it('returns true as fallback when stored value is undefined', () => {
    mockUseLocalStorage.mockReturnValue([undefined, jest.fn(), jest.fn()]);

    const { result } = renderHook(() => useLogViewerWrap());

    expect(result.current[0]).toBe(true);
  });

  it('returns stored wrap preference and setter', () => {
    const setWrapLines = jest.fn();
    mockUseLocalStorage.mockReturnValue([false, setWrapLines, jest.fn()]);

    const { result } = renderHook(() => useLogViewerWrap());

    expect(result.current[0]).toBe(false);
    expect(result.current[1]).toBe(setWrapLines);

    act(() => {
      result.current[1](true);
    });

    expect(setWrapLines).toHaveBeenCalledWith(true);
  });
});
