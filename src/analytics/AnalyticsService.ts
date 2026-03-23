import { logger } from '~/monitoring/logger';
import { obfuscate } from './obfuscate';
import { CommonFields, EventPropertiesMap, getAnalytics, SHA256Hash, TrackEvents } from '.';

export const LOGGED_IN_QUERY_PARAM = 'logged_in';

export interface AnalyticsUser {
  email: string | null;
  preferredUsername: string | null;
}

export class AnalyticsService {
  private commonProperties: Partial<CommonFields> = {};
  private hashedUserIdPromise: Promise<SHA256Hash> | undefined;

  setCommonProperties(properties: Partial<CommonFields>): void {
    this.commonProperties = { ...this.commonProperties, ...properties };
  }

  track<E extends TrackEvents>(event: E, properties: EventPropertiesMap[E]): void {
    void getAnalytics()?.track(event, { ...this.commonProperties, ...properties });
  }

  page(name?: string, properties: Record<string, unknown> = {}): void {
    void getAnalytics()?.page(name, { ...this.commonProperties, ...properties });
  }

  identify(user: AnalyticsUser): void {
    void getAnalytics()?.identify(user.preferredUsername ?? undefined, {
      email: user.email,
      username: user.preferredUsername,
    });
  }

  userLogin(user: AnalyticsUser): void {
    this.identify(user);
    if (user.preferredUsername) {
      this.hashedUserIdPromise = obfuscate(user.preferredUsername);
      void this.hashedUserIdPromise.then((userId) => {
        this.track(TrackEvents.user_login_event, { userId });
      });
    }
    logger.info('User Logged In');
  }

  userLogout(): void {
    const analytics = getAnalytics();
    if (this.hashedUserIdPromise && analytics) {
      void this.hashedUserIdPromise.then((userId) => {
        void analytics.track(TrackEvents.user_logout_event, {
          ...this.commonProperties,
          userId,
        });
        analytics.reset();
        this.hashedUserIdPromise = undefined;
      });
    } else {
      analytics?.reset();
    }
    logger.info('User Logged Out');
  }

  getCommonProperties(): Partial<CommonFields> {
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
