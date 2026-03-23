import { analyticsService } from '../analytics/AnalyticsService';

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
  const mockFn = jest.fn();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jest.spyOn(analyticsService as any, name).mockImplementation(mockFn);

  return mockFn;
};
