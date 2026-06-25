import { useVirtualizer } from '@tanstack/react-virtual';
import { renderHook } from '@testing-library/react';
import { useVirtualization } from '~/shared/components/TableV2/hooks/useVirtualization';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

const mockUseVirtualizer = jest.mocked(useVirtualizer);

describe('useVirtualization', () => {
  const mockVirtualItems = [
    { index: 0, key: '0', start: 0, end: 44, size: 44, lane: 0 },
    { index: 1, key: '1', start: 44, end: 88, size: 44, lane: 0 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVirtualizer.mockReturnValue({
      getVirtualItems: jest.fn().mockReturnValue(mockVirtualItems),
    } as unknown as ReturnType<typeof useVirtualizer>);
  });

  it('returns virtualizer and virtualRows', () => {
    const { result } = renderHook(() => useVirtualization({ count: 10, scrollElement: null }));

    expect(result.current.virtualizer).toBeDefined();
    expect(result.current.virtualRows).toBeDefined();
  });

  it('defaults estimateSize to 44 and overscan to 10', () => {
    renderHook(() => useVirtualization({ count: 5, scrollElement: null }));

    const callArgs = mockUseVirtualizer.mock.calls[0][0];
    expect(callArgs.estimateSize(0)).toBe(44);
    expect(callArgs.overscan).toBe(10);
  });

  it('passes custom estimateSize and overscan', () => {
    renderHook(() =>
      useVirtualization({
        count: 5,
        estimateSize: 60,
        overscan: 20,
        scrollElement: null,
      }),
    );

    const callArgs = mockUseVirtualizer.mock.calls[0][0];
    expect(callArgs.estimateSize(0)).toBe(60);
    expect(callArgs.overscan).toBe(20);
  });

  it('handles null scrollElement gracefully', () => {
    const { result } = renderHook(() => useVirtualization({ count: 10, scrollElement: null }));

    const callArgs = mockUseVirtualizer.mock.calls[0][0];
    expect(callArgs.getScrollElement()).toBeNull();
    expect(result.current.virtualizer).toBeDefined();
  });

  it('passes count to useVirtualizer', () => {
    renderHook(() => useVirtualization({ count: 42, scrollElement: null }));

    const callArgs = mockUseVirtualizer.mock.calls[0][0];
    expect(callArgs.count).toBe(42);
  });

  it('configures measureElement', () => {
    renderHook(() => useVirtualization({ count: 5, scrollElement: null }));

    const callArgs = mockUseVirtualizer.mock.calls[0][0];
    expect(callArgs.measureElement).toBeDefined();
  });

  it('returns virtualRows from virtualizer.getVirtualItems()', () => {
    const { result } = renderHook(() => useVirtualization({ count: 10, scrollElement: null }));

    expect(result.current.virtualRows).toEqual(mockVirtualItems);
  });
});
