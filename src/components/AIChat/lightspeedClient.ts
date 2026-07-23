import { LightspeedClient } from '@redhat-cloud-services/lightspeed-client';
import { LIGHTSPEED_API_BASE } from '~/components/AIChat/consts';

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
    lightspeedClient = new LightspeedClient({
      baseUrl: resolveLightspeedClientBaseUrl(),
    });
  }

  return lightspeedClient;
};
