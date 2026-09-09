import { v4 as uuidv4 } from 'uuid';
import type { SHA256Hash } from './obfuscate';
import { CommonFields, EventPropertiesMap, getAnalytics, TrackEvents } from '.';

export const LOGGED_IN_QUERY_PARAM = 'logged_in';

export type CommonProperties = Pick<CommonFields, 'sessionId'> &
  Partial<Omit<CommonFields, 'sessionId'>>;

export class AnalyticsService {
  private commonProperties: CommonProperties = { sessionId: uuidv4() };

  private userId: SHA256Hash | undefined;

  setCommonProperties(properties: Partial<Omit<CommonFields, 'sessionId'>>): void {
    this.commonProperties = { ...this.commonProperties, ...properties };
  }

  track<E extends TrackEvents>(
    event: E,
    properties: Omit<EventPropertiesMap[E], 'userId'>,
  ): boolean {
    const analytics = getAnalytics();
    const commonProperties = this.getReadyCommonProperties();
    if (!analytics || !commonProperties) {
      return false;
    }

    void analytics.track(event, {
      ...commonProperties,
      ...properties,
      ...(this.userId ? { userId: this.userId } : {}),
    });
    return true;
  }

  /**
   * Like `track()`, but waits for Segment's SDK dispatch/queue operation to
   * settle. The SDK may queue a failed request for retry and still resolve, so
   * this is not proof that Segment has durably stored the event. Use this when
   * a synchronous navigation follows immediately (e.g. logout).
   */
  async trackAndWait<E extends TrackEvents>(
    event: E,
    properties: Omit<EventPropertiesMap[E], 'userId'>,
  ): Promise<boolean> {
    const analytics = getAnalytics();
    const commonProperties = this.getReadyCommonProperties();
    if (!analytics || !commonProperties) {
      return false;
    }

    try {
      await analytics.track(event, {
        ...commonProperties,
        ...properties,
        ...(this.userId ? { userId: this.userId } : {}),
      });
      return true;
    } catch {
      return false;
    }
  }

  identify(userId: SHA256Hash): void {
    this.userId = userId;
    void getAnalytics()?.identify(userId);
  }

  reset(): void {
    const sessionId = uuidv4() as string;
    this.commonProperties = { ...this.commonProperties, sessionId };
    this.userId = undefined;

    const analytics = getAnalytics();
    analytics?.reset();
    analytics?.setAnonymousId(sessionId);
  }

  getCommonProperties(): CommonProperties {
    return { ...this.commonProperties };
  }

  getUserId(): SHA256Hash | undefined {
    return this.userId;
  }

  getReadyCommonProperties(): CommonFields | undefined {
    const { sessionId, clusterVersion, konfluxVersion, kubernetesVersion, openshiftVersion } =
      this.commonProperties;
    if (!clusterVersion || !konfluxVersion || !kubernetesVersion) {
      return undefined;
    }

    return {
      sessionId,
      clusterVersion,
      konfluxVersion,
      kubernetesVersion,
      ...(openshiftVersion ? { openshiftVersion } : {}),
    };
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
