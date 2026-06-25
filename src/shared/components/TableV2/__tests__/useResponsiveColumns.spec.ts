import { renderHook } from '@testing-library/react';
import { type ColumnDefinition } from '~/shared/components/TableV2';
import { useResponsiveColumns } from '~/shared/components/TableV2/hooks/useResponsiveColumns';

// --- matchMedia mock ---

const mockMatchMedia = (width: number) => {
  window.matchMedia = jest.fn().mockImplementation((query: string) => {
    const minWidth = parseInt(query.match(/\d+/)?.[0] ?? '0', 10);
    return {
      matches: width >= minWidth,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      onchange: null,
      dispatchEvent: jest.fn(),
    };
  });
};

// --- Test data ---

interface TestRow {
  id: string;
  name: string;
  status: string;
  details: string;
  extra: string;
}

const columns: ColumnDefinition<TestRow>[] = [
  { id: 'name', header: 'Name', accessorFn: (row) => row.name },
  { id: 'status', header: 'Status', accessorFn: (row) => row.status, visibleFrom: 'sm' },
  { id: 'details', header: 'Details', accessorFn: (row) => row.details, visibleFrom: 'md' },
  { id: 'extra', header: 'Extra', accessorFn: (row) => row.extra, visibleFrom: 'lg' },
];

const allBreakpointColumns: ColumnDefinition<TestRow>[] = [
  { id: 'always', header: 'Always', accessorFn: (row) => row.name },
  { id: 'col-sm', header: 'SM', accessorFn: (row) => row.name, visibleFrom: 'sm' },
  { id: 'col-md', header: 'MD', accessorFn: (row) => row.name, visibleFrom: 'md' },
  { id: 'col-lg', header: 'LG', accessorFn: (row) => row.name, visibleFrom: 'lg' },
  { id: 'col-xl', header: 'XL', accessorFn: (row) => row.name, visibleFrom: 'xl' },
  { id: 'col-2xl', header: '2XL', accessorFn: (row) => row.name, visibleFrom: '2xl' },
];

describe('useResponsiveColumns', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows all columns at large viewport (1500px)', () => {
    mockMatchMedia(1500);
    const { result } = renderHook(() => useResponsiveColumns(allBreakpointColumns));

    // All breakpoint columns should be visible (true)
    expect(result.current.columnVisibility['col-sm']).toBe(true);
    expect(result.current.columnVisibility['col-md']).toBe(true);
    expect(result.current.columnVisibility['col-lg']).toBe(true);
    expect(result.current.columnVisibility['col-xl']).toBe(true);
    expect(result.current.columnVisibility['col-2xl']).toBe(true);
  });

  it('hides columns below their breakpoint at 500px', () => {
    mockMatchMedia(500);
    const { result } = renderHook(() => useResponsiveColumns(allBreakpointColumns));

    // sm=576 not met at 500px, all breakpoint columns hidden
    expect(result.current.columnVisibility['col-sm']).toBe(false);
    expect(result.current.columnVisibility['col-md']).toBe(false);
    expect(result.current.columnVisibility['col-lg']).toBe(false);
    expect(result.current.columnVisibility['col-xl']).toBe(false);
    expect(result.current.columnVisibility['col-2xl']).toBe(false);
  });

  it('shows sm and md columns at 768px, hides lg/xl/2xl', () => {
    mockMatchMedia(768);
    const { result } = renderHook(() => useResponsiveColumns(allBreakpointColumns));

    expect(result.current.columnVisibility['col-sm']).toBe(true);
    expect(result.current.columnVisibility['col-md']).toBe(true);
    expect(result.current.columnVisibility['col-lg']).toBe(false);
    expect(result.current.columnVisibility['col-xl']).toBe(false);
    expect(result.current.columnVisibility['col-2xl']).toBe(false);
  });

  it('shows sm/md/lg columns at 992px, hides xl/2xl', () => {
    mockMatchMedia(992);
    const { result } = renderHook(() => useResponsiveColumns(allBreakpointColumns));

    expect(result.current.columnVisibility['col-sm']).toBe(true);
    expect(result.current.columnVisibility['col-md']).toBe(true);
    expect(result.current.columnVisibility['col-lg']).toBe(true);
    expect(result.current.columnVisibility['col-xl']).toBe(false);
    expect(result.current.columnVisibility['col-2xl']).toBe(false);
  });

  it('does not include columns without visibleFrom in the record', () => {
    mockMatchMedia(1500);
    const { result } = renderHook(() => useResponsiveColumns(allBreakpointColumns));

    // 'always' column has no visibleFrom -- should not appear in columnVisibility
    expect(result.current.columnVisibility).not.toHaveProperty('always');
  });

  it('returns a record mapping column IDs to booleans', () => {
    mockMatchMedia(768);
    const { result } = renderHook(() => useResponsiveColumns(columns));

    const visibility = result.current.columnVisibility;
    // 'name' has no visibleFrom, not in record
    expect(visibility).not.toHaveProperty('name');
    // 'status' (sm=576) visible at 768
    expect(visibility.status).toBe(true);
    // 'details' (md=768) visible at 768
    expect(visibility.details).toBe(true);
    // 'extra' (lg=992) hidden at 768
    expect(visibility.extra).toBe(false);
  });

  it('returns empty object for empty columns array', () => {
    mockMatchMedia(1500);
    const { result } = renderHook(() => useResponsiveColumns([]));

    expect(result.current.columnVisibility).toEqual({});
  });

  it('cleans up matchMedia listeners on unmount', () => {
    const removeEventListener = jest.fn();
    window.matchMedia = jest.fn().mockImplementation((query: string) => {
      const minWidth = parseInt(query.match(/\d+/)?.[0] ?? '0', 10);
      return {
        matches: 1500 >= minWidth,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        onchange: null,
        dispatchEvent: jest.fn(),
      };
    });

    const { unmount } = renderHook(() => useResponsiveColumns(columns));
    unmount();

    // Should have removed listeners for each unique breakpoint used (sm, md, lg)
    expect(removeEventListener).toHaveBeenCalled();
  });
});
