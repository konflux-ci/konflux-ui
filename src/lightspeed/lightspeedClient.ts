import { KonfluxLightspeedClient } from '~/lightspeed/konfluxLightspeedClient';
import { resolveLightspeedClientBaseUrl } from '~/lightspeed/lightspeedConfig';

let lightspeedClient: KonfluxLightspeedClient | undefined;

export const getLightspeedClient = (): KonfluxLightspeedClient => {
  if (!lightspeedClient) {
    // Auth is not configured on LightspeedClient. Requests target same-origin
    // `/api/plugins/lightspeed`, so the browser forwards session cookies and the proxy
    // (dev) or cluster ingress (deployed) forwards credentials to Lightspeed.
    lightspeedClient = new KonfluxLightspeedClient({
      baseUrl: resolveLightspeedClientBaseUrl(),
    });
  }

  return lightspeedClient;
};
