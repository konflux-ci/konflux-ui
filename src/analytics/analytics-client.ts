import type { Analytics } from '@segment/analytics-next';

let analyticsInstance: Analytics | undefined;

export function getAnalytics(): Analytics | undefined {
  return analyticsInstance;
}

export function setAnalytics(analytics: Analytics): void {
  analyticsInstance = analytics;
}
