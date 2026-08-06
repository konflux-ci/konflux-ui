import { renderHook } from '@testing-library/react';
import { useLoadingThreshold } from '../useLoadingThreshold';

const mockCaptureMessage = jest.fn();
const mockEnd = jest.fn();
const mockStartInactiveSpan = jest.fn(() => ({ end: mockEnd, setAttribute: jest.fn() }));

jest.mock('~/monitoring', () => ({
  monitoringService: {
    captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
    startInactiveSpan: (...args: unknown[]) => mockStartInactiveSpan(...args),
  },
}));

const defaultOptions = {
  name: 'test.loading',
  isLoading: false,
  thresholds: { warn: 3000, critical: 8000 },
};

describe('useLoadingThreshold', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('starts a span and sets up timers when isLoading becomes true', () => {
    renderHook(() => useLoadingThreshold({ ...defaultOptions, isLoading: true }));

    expect(mockStartInactiveSpan).toHaveBeenCalledWith({
      name: 'test.loading',
      op: 'ui.loading',
      attributes: undefined,
    });
    expect(mockCaptureMessage).not.toHaveBeenCalled();

    // Advance to warn threshold
    jest.advanceTimersByTime(3000);
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      '[performance] test.loading loading exceeded 3000ms (warn threshold)',
      'warn',
      { threshold: 3000 },
    );

    // Advance to critical threshold
    jest.advanceTimersByTime(5000);
    expect(mockCaptureMessage).toHaveBeenCalledTimes(2);
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      '[performance] test.loading loading exceeded 8000ms (critical threshold)',
      'error',
      { threshold: 8000 },
    );
  });

  it('ends span when loading completes', () => {
    const { rerender } = renderHook(
      ({ isLoading }) => useLoadingThreshold({ ...defaultOptions, isLoading }),
      { initialProps: { isLoading: true } },
    );

    rerender({ isLoading: false });

    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('clears timers when loading completes before thresholds', () => {
    const { rerender } = renderHook(
      ({ isLoading }) => useLoadingThreshold({ ...defaultOptions, isLoading }),
      { initialProps: { isLoading: true } },
    );

    // Stop loading quickly
    rerender({ isLoading: false });

    // Advance past both thresholds
    jest.advanceTimersByTime(10000);

    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it('handles re-entry (loading -> not loading -> loading)', () => {
    const { rerender } = renderHook(
      ({ isLoading }) => useLoadingThreshold({ ...defaultOptions, isLoading }),
      { initialProps: { isLoading: true } },
    );

    // Stop loading before thresholds
    rerender({ isLoading: false });
    expect(mockEnd).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();

    // Start loading again — new span should be created
    rerender({ isLoading: true });
    expect(mockStartInactiveSpan).toHaveBeenCalledTimes(1);

    // Advance to warn threshold — new timers should fire
    jest.advanceTimersByTime(3000);
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      '[performance] test.loading loading exceeded 3000ms (warn threshold)',
      'warn',
      { threshold: 3000 },
    );
  });

  it('cleans up span and timers on unmount', () => {
    const { unmount } = renderHook(() =>
      useLoadingThreshold({ ...defaultOptions, isLoading: true }),
    );

    unmount();

    jest.advanceTimersByTime(10000);

    expect(mockCaptureMessage).not.toHaveBeenCalled();
    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('works when monitoringService is null', () => {
    const monitoringModule: { monitoringService: unknown } = jest.requireMock('~/monitoring');
    const originalService = monitoringModule.monitoringService;
    monitoringModule.monitoringService = null;

    try {
      const { rerender } = renderHook(
        ({ isLoading }) => useLoadingThreshold({ ...defaultOptions, isLoading }),
        { initialProps: { isLoading: true } },
      );

      // Advance past thresholds — should not throw
      jest.advanceTimersByTime(10000);

      rerender({ isLoading: false });

      expect(mockCaptureMessage).not.toHaveBeenCalled();
    } finally {
      monitoringModule.monitoringService = originalService;
    }
  });

  it('passes attributes to span and captureMessage', () => {
    const attributes = { view: 'list', count: 42 };

    renderHook(() => useLoadingThreshold({ ...defaultOptions, isLoading: true, attributes }));

    expect(mockStartInactiveSpan).toHaveBeenCalledWith({
      name: 'test.loading',
      op: 'ui.loading',
      attributes: { view: 'list', count: 42 },
    });

    jest.advanceTimersByTime(3000);
    expect(mockCaptureMessage).toHaveBeenCalledWith(expect.any(String), 'warn', {
      threshold: 3000,
      view: 'list',
      count: 42,
    });
  });
});
