import { LightspeedClient } from '@redhat-cloud-services/lightspeed-client';
import { resolveLightspeedClientBaseUrl } from '~/lightspeed/lightspeedConfig';

let lightspeedClient: LightspeedClient | undefined;

export const getLightspeedClient = (): LightspeedClient => {
  if (!lightspeedClient) {
    // Auth is not configured on LightspeedClient. Requests target same-origin
    // `/api/plugins/lightspeed`, so the browser forwards session cookies and the proxy
    // (dev) or cluster ingress (deployed) forwards credentials to Lightspeed.
    lightspeedClient = new LightspeedClient({
      baseUrl: resolveLightspeedClientBaseUrl(),
    });
  }

  return lightspeedClient;
};
