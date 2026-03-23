import { CommonFields, EventPropertiesMap, getAnalytics, TrackEvents } from '.';

export const LOGGED_IN_QUERY_PARAM = 'logged_in';

export class AnalyticsService {
  private commonProperties: Partial<CommonFields> = {};

  setCommonProperties(properties: Partial<CommonFields>): void {
    this.commonProperties = { ...this.commonProperties, ...properties };
  }

  track<E extends TrackEvents>(event: E, properties: EventPropertiesMap[E]): void {
    void getAnalytics()?.track(event, { ...this.commonProperties, ...properties });
  }

  page(name?: string, properties: Record<string, unknown> = {}): void {
    void getAnalytics()?.page(name, { ...this.commonProperties, ...properties });
  }

  identify(userId: string): void {
    void getAnalytics()?.identify(userId);
  }

  reset(): void {
    void getAnalytics()?.reset();
  }

  getCommonProperties(): Partial<CommonFields> {
    return { ...(this.commonProperties ?? {}) };
  }
}

export const analyticsService = new AnalyticsService();

/**
 * Checks if the current URL has the logged_in query param (set by redirectToLogin).
 * If present, this is a real OAuth login — not a page refresh.
 */
export function consumeLoginSignal(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (!params.has(LOGGED_IN_QUERY_PARAM)) {
    return false;
  }
  params.delete(LOGGED_IN_QUERY_PARAM);
  const search = params.toString();
  const newUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', newUrl);
  return true;
}
