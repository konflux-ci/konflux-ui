import { LightspeedClient } from '@redhat-cloud-services/lightspeed-client';
import { resolveLightspeedClientBaseUrl } from '~/lightspeed/lightspeedConfig';
import {
  isLightspeedQueryRequest,
  mergePendingFieldsIntoQueryBody,
} from '~/lightspeed/lightspeedQueryRequestBridge';

let lightspeedClient: LightspeedClient | undefined;

/**
 * Injects pending query fields into Lightspeed query bodies.
 * Other requests, including the health check, are unchanged.
 */
export const lightspeedFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  if (init && typeof init.body === 'string' && isLightspeedQueryRequest(input, init)) {
    return fetch(input, {
      ...init,
      body: mergePendingFieldsIntoQueryBody(init.body),
    });
  }

  return fetch(input, init);
};

export const getLightspeedClient = (): LightspeedClient => {
  if (!lightspeedClient) {
    // Auth is not configured on LightspeedClient. Requests target same-origin
    // `/api/plugins/lightspeed`, so the browser forwards session cookies and the proxy
    // (dev) or cluster ingress (deployed) forwards credentials to Lightspeed.
    lightspeedClient = new LightspeedClient({
      baseUrl: resolveLightspeedClientBaseUrl(),
      fetchFunction: lightspeedFetch,
    });
  }

  return lightspeedClient;
};
