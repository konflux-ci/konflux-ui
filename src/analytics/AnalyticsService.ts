import type { AnalyticsProperties } from '~/utils/analytics';
import { getAnalytics } from '.';
import { logger } from '~/monitoring/logger';

export const LOGGED_IN_QUERY_PARAM = 'logged_in';

export interface AnalyticsUser {
  email: string | null;
  preferredUsername: string | null;
}

export class AnalyticsService {
  private commonProperties: AnalyticsProperties = {};

  setCommonProperties(properties: AnalyticsProperties): void {
    this.commonProperties = { ...this.commonProperties, ...properties };
  }

  track(_event: string, _properties: AnalyticsProperties = {}): void {
    // noop — will be wired to getAnalytics()?.track() later
  }

  page(_name?: string, _properties: AnalyticsProperties = {}): void {
    // noop — will be wired to getAnalytics()?.page() later
  }

  identify(user: AnalyticsUser): void {
    getAnalytics()?.identify(user.preferredUsername ?? undefined, {
      email: user.email,
      username: user.preferredUsername,
    });
  }

  userLogin(user: AnalyticsUser): void {
    this.identify(user);
    logger.info('User Logged In');
  }

  userLogout(): void {
    getAnalytics()?.reset();
    logger.info('User Logged Out');
  }

  getCommonProperties(): AnalyticsProperties {
    return { ...this.commonProperties };
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
