import { LightspeedClient } from '@redhat-cloud-services/lightspeed-client';
import { LIGHTSPEED_API_BASE } from '~/lightspeed/lightspeedConfig';

let lightspeedClient: LightspeedClient | undefined;

const resolveLightspeedClientBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return LIGHTSPEED_API_BASE;
  }

  // LightspeedClient.buildUrl() uses `new URL(baseUrl)`, which requires an absolute URL.
  return new URL(LIGHTSPEED_API_BASE, window.location.origin).href.replace(/\/$/, '');
};

export const getLightspeedClient = (): LightspeedClient => {
  if (!lightspeedClient) {
    // Auth is not configured on LightspeedClient. Requests target same-origin
    // `/api/lightspeed`, so the browser forwards session cookies and the proxy
    // (dev) or cluster ingress (deployed) forwards credentials to Lightspeed.
    lightspeedClient = new LightspeedClient({
      baseUrl: resolveLightspeedClientBaseUrl(),
    });
  }

  return lightspeedClient;
};
