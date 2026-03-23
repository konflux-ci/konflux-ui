import { renderHook, act } from '@testing-library/react';
import { useTheme } from '~/shared/theme';
import { useLocalStorage } from '../../../../hooks/useLocalStorage';
import { useLogViewerTheme } from '../useLogViewerTheme';

const LOG_THEME_STORAGE_KEY = 'konflux-logs-theme-preference';

jest.mock('~/shared/theme', () => ({
  useTheme: jest.fn(),
}));

jest.mock('../../../../hooks/useLocalStorage', () => ({
  useLocalStorage: jest.fn(),
}));

const mockUseTheme = useTheme as jest.Mock;
const mockUseLocalStorage = useLocalStorage as jest.Mock;

describe('useLogViewerTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.removeItem(LOG_THEME_STORAGE_KEY);
    mockUseTheme.mockReturnValue({ effectiveTheme: 'light' });
  });

  describe('initial value / getStoredLogTheme', () => {
    const mockImpl = (key: string, initialValue: string) => {
      const raw = window.localStorage.getItem(key);
      const value = raw === 'dark' || raw === 'light' ? raw : initialValue;
      return [value ?? initialValue ?? 'dark', jest.fn(), jest.fn()];
    };

    it('returns dark when localStorage is empty', () => {
      mockUseLocalStorage.mockImplementation(mockImpl);

      const { result } = renderHook(() => useLogViewerTheme());

      expect(result.current[0]).toBe('dark');
      expect(result.current[1]).toBeDefined();
    });

    it('returns stored light when getStoredLogTheme provides light', () => {
      window.localStorage.setItem(LOG_THEME_STORAGE_KEY, 'light');
      mockUseLocalStorage.mockImplementation(mockImpl);

      const { result } = renderHook(() => useLogViewerTheme());

      expect(result.current[0]).toBe('light');
    });

    it('returns stored dark when getStoredLogTheme provides dark', () => {
      window.localStorage.setItem(LOG_THEME_STORAGE_KEY, 'dark');
      mockUseLocalStorage.mockImplementation(mockImpl);

      const { result } = renderHook(() => useLogViewerTheme());

      expect(result.current[0]).toBe('dark');
    });

    it('returns dark when localStorage has invalid value', () => {
      window.localStorage.setItem(LOG_THEME_STORAGE_KEY, 'invalid');
      mockUseLocalStorage.mockImplementation((_key: string, initialValue: string) => {
        return [initialValue ?? 'dark', jest.fn(), jest.fn()];
      });

      const { result } = renderHook(() => useLogViewerTheme());

      expect(result.current[0]).toBe('dark');
    });
  });

  describe('return value and fallback', () => {
    it('returns dark as fallback when logTheme is undefined', () => {
      mockUseLocalStorage.mockReturnValue([undefined, jest.fn(), jest.fn()]);

      const { result } = renderHook(() => useLogViewerTheme());

      expect(result.current[0]).toBe('dark');
    });

    it('returns logTheme and setter when logTheme is defined', () => {
      const setLogTheme = jest.fn();
      mockUseLocalStorage.mockReturnValue(['light', setLogTheme, jest.fn()]);

      const { result } = renderHook(() => useLogViewerTheme());

      expect(result.current[0]).toBe('light');
      expect(result.current[1]).toBe(setLogTheme);
    });

    it('allows updating logTheme via setter', () => {
      const setLogTheme = jest.fn();
      mockUseLocalStorage.mockReturnValue(['dark', setLogTheme, jest.fn()]);

      const { result } = renderHook(() => useLogViewerTheme());

      expect(result.current[0]).toBe('dark');

      act(() => {
        result.current[1]('light');
      });

      expect(setLogTheme).toHaveBeenCalledWith('light');
    });
  });

  describe('useEffect sync when effectiveTheme changes', () => {
    it('calls setLogTheme with new effectiveTheme when effectiveTheme changes', () => {
      const setLogThemeSpy = jest.fn();
      mockUseLocalStorage.mockReturnValue(['light', setLogThemeSpy, jest.fn()]);
      mockUseTheme
        .mockReturnValueOnce({ effectiveTheme: 'light' })
        .mockReturnValue({ effectiveTheme: 'dark' });

      const { rerender } = renderHook(() => useLogViewerTheme());

      rerender();

      expect(setLogThemeSpy).toHaveBeenCalledWith('dark');
    });
  });
});
