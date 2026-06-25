import { useVirtualizer } from '@tanstack/react-virtual';

/**
 * Sets up a mock for @tanstack/react-virtual's useVirtualizer that renders
 * all items synchronously (no scroll container needed). Call in beforeEach.
 *
 * Assumes that `@tanstack/react-virtual` is already `jest.mock()`'d by the test file.
 *
 * Returns the mock function for additional assertions if needed.
 */
export function setupVirtualizerMock(): jest.MockedFunction<typeof useVirtualizer> {
  const mockFn = jest.mocked(useVirtualizer);
  mockFn.mockImplementation((opts) => {
    const items = Array.from({ length: opts.count }, (_, i) => ({
      index: i,
      key: i,
      start: i * 44,
      end: (i + 1) * 44,
      size: 44,
      lane: 0,
    }));
    return {
      getVirtualItems: () => items,
      getTotalSize: () => opts.count * 44,
      measureElement: () => undefined,
      scrollToIndex: () => undefined,
      scrollToOffset: () => undefined,
      measure: () => undefined,
      getOffsetForIndex: () => [0, 0] as [number, number],
      options: { count: opts.count },
    } as unknown as ReturnType<typeof useVirtualizer>;
  });
  return mockFn;
}
