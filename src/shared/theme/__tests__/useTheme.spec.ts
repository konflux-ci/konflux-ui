import { renderHook, act } from '@testing-library/react';
import { THEME_SYSTEM, THEME_DARK, THEME_LIGHT } from '../const';
import { useTheme } from '../useTheme';

const THEME_STORAGE_KEY = 'konflux-theme-preference';
const DARK_THEME_CLASS = 'pf-v5-theme-dark';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock matchMedia
const mockMatchMedia = jest.fn();

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

  // Clear any existing classes
  document.documentElement.classList.remove(DARK_THEME_CLASS);
});

describe('useTheme', () => {
  it('should initialize with system preference by default', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe(THEME_SYSTEM);
    expect(result.current.systemPreference).toBe(THEME_LIGHT);
    expect(result.current.effectiveTheme).toBe(THEME_LIGHT);
  });

  it('should load stored preference from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue(THEME_DARK);
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe(THEME_DARK);
    expect(result.current.effectiveTheme).toBe(THEME_DARK);
  });

  it('should detect dark system preference', () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useTheme());

    expect(result.current.systemPreference).toBe(THEME_DARK);
    expect(result.current.effectiveTheme).toBe(THEME_DARK);
  });

  it('should apply dark theme class when effective theme is dark', () => {
    mockLocalStorage.getItem.mockReturnValue(THEME_DARK);
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    renderHook(() => useTheme());

    expect(document.documentElement.classList.contains(DARK_THEME_CLASS)).toBe(true);
  });

  it('should remove dark theme class when effective theme is light', () => {
    mockLocalStorage.getItem.mockReturnValue(THEME_LIGHT);
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    renderHook(() => useTheme());

    expect(document.documentElement.classList.contains(DARK_THEME_CLASS)).toBe(false);
  });

  it('should save preference to localStorage when changed', () => {
    mockLocalStorage.getItem.mockReturnValue(THEME_SYSTEM);
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });

    const { result } = renderHook(() => useTheme());

    act(() => {
      result.current.setThemePreference(THEME_DARK);
    });

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, THEME_DARK);
    expect(result.current.preference).toBe(THEME_DARK);
  });

  it('should listen for system preference changes', () => {
    let eventHandler: ((e: MediaQueryListEvent) => void) | undefined;
    const mockAddEventListener = jest.fn((_, handler) => {
      eventHandler = handler;
    });
    const mockRemoveEventListener = jest.fn();

    mockLocalStorage.getItem.mockReturnValue(THEME_SYSTEM);
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    });

    const { result, unmount } = renderHook(() => useTheme());

    // Simulate system preference change
    act(() => {
      eventHandler?.({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current.systemPreference).toBe(THEME_DARK);
    expect(result.current.effectiveTheme).toBe(THEME_DARK);

    // Cleanup should remove event listener
    unmount();
    expect(mockRemoveEventListener).toHaveBeenCalled();
  });
});
