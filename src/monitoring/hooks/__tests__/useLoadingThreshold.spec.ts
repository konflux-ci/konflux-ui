import { renderHook } from '@testing-library/react';
import { useLoadingThreshold } from '../useLoadingThreshold';

const mockCaptureMessage = jest.fn();
const mockReportMetric = jest.fn();

jest.mock('~/monitoring', () => ({
  monitoringService: {
    captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
    reportMetric: (...args: unknown[]) => mockReportMetric(...args),
  },
}));

const defaultOptions = {
  name: 'test.loading',
  isLoading: false,
  thresholds: { warn: 3000, critical: 8000 },
};

let performanceNowValue = 0;

describe('useLoadingThreshold', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    performanceNowValue = 0;
    jest.spyOn(performance, 'now').mockImplementation(() => performanceNowValue);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('sets up timers when isLoading becomes true and fires at thresholds', () => {
    renderHook(() => useLoadingThreshold({ ...defaultOptions, isLoading: true }));

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

  it('reports metric when loading completes', () => {
    performanceNowValue = 1000;
    const { rerender } = renderHook(
      ({ isLoading }) => useLoadingThreshold({ ...defaultOptions, isLoading }),
      { initialProps: { isLoading: true } },
    );

    performanceNowValue = 3500;
    rerender({ isLoading: false });

    expect(mockReportMetric).toHaveBeenCalledTimes(1);
    expect(mockReportMetric).toHaveBeenCalledWith('test.loading', 2500, {
      unit: 'millisecond',
      attributes: undefined,
    });
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
    performanceNowValue = 0;
    const { rerender } = renderHook(
      ({ isLoading }) => useLoadingThreshold({ ...defaultOptions, isLoading }),
      { initialProps: { isLoading: true } },
    );

    // Stop loading before thresholds
    performanceNowValue = 1000;
    rerender({ isLoading: false });

    jest.clearAllMocks();

    // Start loading again
    performanceNowValue = 2000;
    rerender({ isLoading: true });

    // Advance to warn threshold — new timers should fire
    jest.advanceTimersByTime(3000);
    expect(mockCaptureMessage).toHaveBeenCalledTimes(1);
    expect(mockCaptureMessage).toHaveBeenCalledWith(
      '[performance] test.loading loading exceeded 3000ms (warn threshold)',
      'warn',
      { threshold: 3000 },
    );
  });

  it('cleans up timers on unmount', () => {
    const { unmount } = renderHook(() =>
      useLoadingThreshold({ ...defaultOptions, isLoading: true }),
    );

    unmount();

    jest.advanceTimersByTime(10000);

    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it('works when monitoringService is null', () => {
    // Override the mock to return null for this test
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

      performanceNowValue = 5000;
      rerender({ isLoading: false });

      // No errors thrown
      expect(mockCaptureMessage).not.toHaveBeenCalled();
      expect(mockReportMetric).not.toHaveBeenCalled();
    } finally {
      monitoringModule.monitoringService = originalService;
    }
  });

  it('passes attributes to captureMessage and reportMetric', () => {
    const attributes = { view: 'list', count: 42 };
    performanceNowValue = 0;

    const { rerender } = renderHook(
      ({ isLoading }) => useLoadingThreshold({ ...defaultOptions, isLoading, attributes }),
      { initialProps: { isLoading: true } },
    );

    jest.advanceTimersByTime(3000);
    expect(mockCaptureMessage).toHaveBeenCalledWith(expect.any(String), 'warn', {
      threshold: 3000,
      view: 'list',
      count: 42,
    });

    performanceNowValue = 2000;
    rerender({ isLoading: false });

    expect(mockReportMetric).toHaveBeenCalledWith('test.loading', 2000, {
      unit: 'millisecond',
      attributes: { view: 'list', count: 42 },
    });
  });
});
