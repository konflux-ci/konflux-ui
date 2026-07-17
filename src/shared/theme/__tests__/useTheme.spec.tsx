import { renderHook, act } from '@testing-library/react';
import { useEventListener } from '../../hooks/useEventListener';
import {
  THEME_SYSTEM,
  THEME_DARK,
  THEME_LIGHT,
  CONTRAST_SYSTEM,
  CONTRAST_DEFAULT,
  CONTRAST_HIGH,
} from '../const';
import { ThemeProvider } from '../ThemeContext';
import { useTheme } from '../useTheme';

const THEME_STORAGE_KEY = 'konflux-theme-preference';
const CONTRAST_STORAGE_KEY = 'konflux-contrast-preference';
const DARK_THEME_CLASS = 'pf-v6-theme-dark';
const HIGH_CONTRAST_CLASS = 'pf-v6-theme-high-contrast';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock matchMedia
const mockMatchMedia = jest.fn();

// Mock useEventListener hook
jest.mock('../../hooks/useEventListener', () => ({
  useEventListener: jest.fn(),
}));

const mockUseEventListener = useEventListener as jest.Mock;

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true,
  });

  Object.defineProperty(window, 'matchMedia', {
    value: mockMatchMedia,
    writable: true,
  });

  // Reset mocks
  mockLocalStorage.getItem.mockClear();
  mockLocalStorage.setItem.mockClear();
  mockMatchMedia.mockClear();
  mockUseEventListener.mockClear();

  // Default: light system preference, no contrast preference
  mockMatchMedia.mockReturnValue({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });

  // Clear any existing classes
  document.documentElement.classList.remove(DARK_THEME_CLASS);
  document.documentElement.classList.remove(HIGH_CONTRAST_CLASS);
});

const TestWrapper = ({ children }) => <ThemeProvider>{children}</ThemeProvider>;

describe('useTheme', () => {
  it('should initialize with system preference by default', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useTheme(), { wrapper: TestWrapper });

    expect(result.current.preference).toBe(THEME_SYSTEM);
    expect(result.current.systemPreference).toBe(THEME_LIGHT);
    expect(result.current.effectiveTheme).toBe(THEME_LIGHT);
    expect(result.current.contrastPreference).toBe(CONTRAST_SYSTEM);
    expect(result.current.effectiveContrast).toBe(CONTRAST_DEFAULT);
  });

  it('should load stored preference from localStorage', () => {
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === THEME_STORAGE_KEY) return JSON.stringify(THEME_DARK);
      return null;
    });

    const { result } = renderHook(() => useTheme(), { wrapper: TestWrapper });

    expect(result.current.preference).toBe(THEME_DARK);
    expect(result.current.effectiveTheme).toBe(THEME_DARK);
  });

  it('should load stored contrast preference from localStorage', () => {
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === CONTRAST_STORAGE_KEY) return JSON.stringify(CONTRAST_HIGH);
      return null;
    });

    const { result } = renderHook(() => useTheme(), { wrapper: TestWrapper });

    expect(result.current.contrastPreference).toBe(CONTRAST_HIGH);
    expect(result.current.effectiveContrast).toBe(CONTRAST_HIGH);
  });

  it('should detect dark system preference', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useTheme(), { wrapper: TestWrapper });

    expect(result.current.systemPreference).toBe(THEME_DARK);
    expect(result.current.effectiveTheme).toBe(THEME_DARK);
  });

  it('should apply dark theme class when effective theme is dark', () => {
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === THEME_STORAGE_KEY) return JSON.stringify(THEME_DARK);
      return null;
    });

    renderHook(() => useTheme(), { wrapper: TestWrapper });

    expect(document.documentElement.classList.contains(DARK_THEME_CLASS)).toBe(true);
  });

  it('should remove dark theme class when effective theme is light', () => {
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === THEME_STORAGE_KEY) return JSON.stringify(THEME_LIGHT);
      return null;
    });

    renderHook(() => useTheme(), { wrapper: TestWrapper });

    expect(document.documentElement.classList.contains(DARK_THEME_CLASS)).toBe(false);
  });

  it('should apply high contrast class when contrast preference is high-contrast', () => {
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === CONTRAST_STORAGE_KEY) return JSON.stringify(CONTRAST_HIGH);
      return null;
    });

    renderHook(() => useTheme(), { wrapper: TestWrapper });

    expect(document.documentElement.classList.contains(HIGH_CONTRAST_CLASS)).toBe(true);
  });

  it('should remove high contrast class when contrast preference is default', () => {
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === CONTRAST_STORAGE_KEY) return JSON.stringify(CONTRAST_DEFAULT);
      return null;
    });

    renderHook(() => useTheme(), { wrapper: TestWrapper });

    expect(document.documentElement.classList.contains(HIGH_CONTRAST_CLASS)).toBe(false);
  });

  it('should save preference to localStorage when changed', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useTheme(), { wrapper: TestWrapper });

    act(() => {
      result.current.setThemePreference(THEME_DARK);
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      THEME_STORAGE_KEY,
      JSON.stringify(THEME_DARK),
    );
    expect(result.current.preference).toBe(THEME_DARK);
  });

  it('should save contrast preference to localStorage when changed', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useTheme(), { wrapper: TestWrapper });

    act(() => {
      result.current.setContrastPreference(CONTRAST_HIGH);
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      CONTRAST_STORAGE_KEY,
      JSON.stringify(CONTRAST_HIGH),
    );
    expect(result.current.contrastPreference).toBe(CONTRAST_HIGH);
  });

  it('should listen for system preference changes', () => {
    const eventHandlers: Record<string, ((e: MediaQueryListEvent) => void)[]> = {};

    mockUseEventListener.mockImplementation(
      (eventName: string, handler: (e: MediaQueryListEvent) => void) => {
        if (!eventHandlers[eventName]) {
          eventHandlers[eventName] = [];
        }
        eventHandlers[eventName].push(handler);
      },
    );

    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useTheme(), { wrapper: TestWrapper });

    // Simulate system preference change to dark
    act(() => {
      eventHandlers.change?.[0]?.({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current.systemPreference).toBe(THEME_DARK);
    expect(result.current.effectiveTheme).toBe(THEME_DARK);
  });

  it('should auto-enable high contrast when system prefers it and contrast is set to system', () => {
    const eventHandlers: ((e: MediaQueryListEvent) => void)[] = [];

    mockUseEventListener.mockImplementation(
      (_eventName: string, handler: (e: MediaQueryListEvent) => void) => {
        eventHandlers.push(handler);
      },
    );

    mockLocalStorage.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useTheme(), { wrapper: TestWrapper });

    // Simulate system prefers-contrast: more change
    // The second handler is for prefers-contrast
    act(() => {
      eventHandlers[1]?.({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current.effectiveContrast).toBe(CONTRAST_HIGH);
  });

  it('should not auto-enable high contrast when contrast is explicitly set to default', () => {
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === CONTRAST_STORAGE_KEY) return JSON.stringify(CONTRAST_DEFAULT);
      return null;
    });

    const eventHandlers: ((e: MediaQueryListEvent) => void)[] = [];

    mockUseEventListener.mockImplementation(
      (_eventName: string, handler: (e: MediaQueryListEvent) => void) => {
        eventHandlers.push(handler);
      },
    );

    const { result } = renderHook(() => useTheme(), { wrapper: TestWrapper });

    // Simulate system prefers-contrast: more change
    act(() => {
      eventHandlers[1]?.({ matches: true } as MediaQueryListEvent);
    });

    // Should remain default because user explicitly chose default, not system
    expect(result.current.effectiveContrast).toBe(CONTRAST_DEFAULT);
  });
});
