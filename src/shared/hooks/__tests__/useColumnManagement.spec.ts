import { renderHook, act } from '@testing-library/react';
import { useColumnManagement } from '../useColumnManagement';

type TestColumnKey = 'name' | 'created' | 'status' | 'kebab';

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('useColumnManagement', () => {
  const defaultVisibleColumns = new Set<TestColumnKey>(['name', 'created', 'status', 'kebab']);
  const storageKey = 'test-columns';
  const requiredColumns: TestColumnKey[] = ['name', 'kebab'];

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with default visible columns', () => {
    const { result } = renderHook(() =>
      useColumnManagement({
        defaultVisibleColumns,
        storageKey,
        requiredColumns,
      }),
    );

    expect(result.current.visibleColumns).toEqual(defaultVisibleColumns);
    expect(result.current.isColumnManagementOpen).toBe(false);
  });

  it('loads columns from localStorage on mount', () => {
    const storedColumns = ['name', 'created'];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedColumns));

    const { result } = renderHook(() =>
      useColumnManagement({
        defaultVisibleColumns,
        storageKey,
        requiredColumns,
      }),
    );

    // Should include stored columns plus required columns
    expect(result.current.visibleColumns).toEqual(new Set(['name', 'created', 'kebab']));
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith(storageKey);
  });

  it('handles invalid localStorage data gracefully', () => {
    mockLocalStorage.getItem.mockReturnValue('invalid json');
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useColumnManagement({
        defaultVisibleColumns,
        storageKey,
        requiredColumns,
      }),
    );

    expect(result.current.visibleColumns).toEqual(defaultVisibleColumns);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load column visibility from localStorage:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it('opens and closes column management modal', () => {
    const { result } = renderHook(() =>
      useColumnManagement({
        defaultVisibleColumns,
        storageKey,
        requiredColumns,
      }),
    );

    expect(result.current.isColumnManagementOpen).toBe(false);

    act(() => {
      result.current.openColumnManagement();
    });

    expect(result.current.isColumnManagementOpen).toBe(true);

    act(() => {
      result.current.closeColumnManagement();
    });

    expect(result.current.isColumnManagementOpen).toBe(false);
  });

  it('handles visible columns change and saves to localStorage', () => {
    const { result } = renderHook(() =>
      useColumnManagement({
        defaultVisibleColumns,
        storageKey,
        requiredColumns,
      }),
    );

    const newColumns = new Set<TestColumnKey>(['name', 'status']);

    act(() => {
      result.current.handleVisibleColumnsChange(newColumns);
    });

    // Should include new columns plus required columns
    const expectedColumns = new Set(['name', 'status', 'kebab']);
    expect(result.current.visibleColumns).toEqual(expectedColumns);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      storageKey,
      JSON.stringify(Array.from(expectedColumns)),
    );
  });

  it('handles localStorage save error gracefully', () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage full');
    });
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useColumnManagement({
        defaultVisibleColumns,
        storageKey,
        requiredColumns,
      }),
    );

    const newColumns = new Set<TestColumnKey>(['name', 'status']);

    act(() => {
      result.current.handleVisibleColumnsChange(newColumns);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to save column visibility to localStorage:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it('correctly identifies visible columns', () => {
    const { result } = renderHook(() =>
      useColumnManagement({
        defaultVisibleColumns,
        storageKey,
        requiredColumns,
      }),
    );

    expect(result.current.isColumnVisible('name')).toBe(true);
    expect(result.current.isColumnVisible('created')).toBe(true);
    expect(result.current.isColumnVisible('status')).toBe(true);
    expect(result.current.isColumnVisible('kebab')).toBe(true);
  });

  it('works without required columns', () => {
    const { result } = renderHook(() =>
      useColumnManagement({
        defaultVisibleColumns,
        storageKey,
      }),
    );

    const newColumns = new Set<TestColumnKey>(['name', 'status']);

    act(() => {
      result.current.handleVisibleColumnsChange(newColumns);
    });

    expect(result.current.visibleColumns).toEqual(newColumns);
  });
});
