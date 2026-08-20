import { renderHook } from '@testing-library/react';
import type { ThresholdConfig } from '~/monitoring/thresholds';
import { useRenderTiming } from '../useRenderTiming';

const mockEnd = jest.fn();
const mockSetAttribute = jest.fn();
const mockStartInactiveSpan = jest.fn(() => ({ end: mockEnd, setAttribute: mockSetAttribute }));
const mockCaptureMessage = jest.fn();

let monitoringServiceOverride: {
  startInactiveSpan: jest.Mock;
  captureMessage: jest.Mock;
} | null = {
  startInactiveSpan: mockStartInactiveSpan,
  captureMessage: mockCaptureMessage,
};

jest.mock('~/monitoring', () => ({
  get monitoringService() {
    return monitoringServiceOverride;
  },
}));

let performanceNowValue = 0;

const defaultThresholds: ThresholdConfig = { warn: 3000, critical: 8000 };

describe('useRenderTiming', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceNowValue = 0;
    jest.spyOn(performance, 'now').mockImplementation(() => performanceNowValue);
    monitoringServiceOverride = {
      startInactiveSpan: mockStartInactiveSpan,
      captureMessage: mockCaptureMessage,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('ends span when isReady becomes true', () => {
    const attributes = { view: 'list' };

    const { rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) =>
        useRenderTiming({
          name: 'test.render',
          isReady,
          thresholds: defaultThresholds,
          attributes,
        }),
      { initialProps: { isReady: false } },
    );

    expect(mockStartInactiveSpan).toHaveBeenCalledWith({
      name: 'test.render',
      op: 'ui.render',
      attributes,
    });

    performanceNowValue = 1500;
    rerender({ isReady: true });

    expect(mockSetAttribute).toHaveBeenCalledWith('duration_ms', 1500);
    expect(mockEnd).toHaveBeenCalled();
  });

  it('does not report more than once', () => {
    const { rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) =>
        useRenderTiming({
          name: 'test.render',
          isReady,
          thresholds: defaultThresholds,
        }),
      { initialProps: { isReady: true } },
    );

    rerender({ isReady: false });
    rerender({ isReady: true });

    expect(mockEnd).toHaveBeenCalledTimes(1);
  });

  it('captures warning message when duration exceeds warn threshold', () => {
    performanceNowValue = 0;

    const { rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) =>
        useRenderTiming({
          name: 'test.render',
          isReady,
          thresholds: defaultThresholds,
        }),
      { initialProps: { isReady: false } },
    );

    performanceNowValue = 4000;
    rerender({ isReady: true });

    expect(mockCaptureMessage).toHaveBeenCalledWith(
      '[performance] test.render took 4000ms (warn threshold: 3000ms)',
      'warn',
      { duration: 4000, threshold: 3000 },
    );
  });

  it('captures error message when duration exceeds critical threshold', () => {
    performanceNowValue = 0;

    const { rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) =>
        useRenderTiming({
          name: 'test.render',
          isReady,
          thresholds: defaultThresholds,
        }),
      { initialProps: { isReady: false } },
    );

    performanceNowValue = 9000;
    rerender({ isReady: true });

    expect(mockCaptureMessage).toHaveBeenCalledWith(
      '[performance] test.render took 9000ms (critical threshold: 8000ms)',
      'error',
      { duration: 9000, threshold: 8000 },
    );
  });

  it('does not capture message when below warn threshold', () => {
    performanceNowValue = 0;

    const { rerender } = renderHook(
      ({ isReady }: { isReady: boolean }) =>
        useRenderTiming({
          name: 'test.render',
          isReady,
          thresholds: defaultThresholds,
        }),
      { initialProps: { isReady: false } },
    );

    performanceNowValue = 1000;
    rerender({ isReady: true });

    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it('ends span on unmount if not yet ready', () => {
    const { unmount } = renderHook(() =>
      useRenderTiming({
        name: 'test.render',
        isReady: false,
        thresholds: defaultThresholds,
      }),
    );

    unmount();

    expect(mockEnd).toHaveBeenCalled();
  });

  it('works when monitoringService is null', () => {
    monitoringServiceOverride = null;

    expect(() => {
      const { rerender } = renderHook(
        ({ isReady }: { isReady: boolean }) =>
          useRenderTiming({
            name: 'test.render',
            isReady,
            thresholds: defaultThresholds,
          }),
        { initialProps: { isReady: false } },
      );

      performanceNowValue = 5000;
      rerender({ isReady: true });
    }).not.toThrow();
  });
});
