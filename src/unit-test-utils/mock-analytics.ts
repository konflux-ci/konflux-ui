import { analyticsService } from '~/analytics/AnalyticsService';

/**
 * Spies on an analyticsService method and replaces it with a jest.fn().
 * Works on the singleton instance — all code that calls the method will hit the spy.
 *
 * @example
 * const trackMock = mockAnalyticsServiceFn('track');
 * // render component that fires analyticsService.track(...)
 * expect(trackMock).toHaveBeenCalledWith(TrackEvents.user_login_event, { userId });
 */
export const mockAnalyticsServiceFn = (name: string) => {
  // Lazy import avoids eagerly loading the analytics module tree
  // (which pulls in conditional-checks → feature-flags hooks) at module init time.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockFn = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jest.spyOn(analyticsService, name as keyof typeof analyticsService).mockImplementation(mockFn);

  return mockFn;
};
