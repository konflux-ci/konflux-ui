import type { IFetchFunction } from '@redhat-cloud-services/ai-client-common';
import { LightspeedClient } from '@redhat-cloud-services/lightspeed-client';
import { LIGHTSPEED_API_BASE } from '~/components/AIChat/consts';
import { mergeAttachmentsIntoFetchInit } from '~/components/AIChat/lightspeed-attachments';

let lightspeedClient: LightspeedClient | undefined;

const resolveLightspeedClientBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return LIGHTSPEED_API_BASE;
  }

  // LightspeedClient.buildUrl() uses `new URL(baseUrl)`, which requires an absolute URL.
  return new URL(LIGHTSPEED_API_BASE, window.location.origin).href.replace(/\/$/, '');
};

const lightspeedFetch: IFetchFunction = (input, init) =>
  fetch(input, mergeAttachmentsIntoFetchInit(input, init));

export const getLightspeedClient = (): LightspeedClient => {
  if (!lightspeedClient) {
    lightspeedClient = new LightspeedClient({
      baseUrl: resolveLightspeedClientBaseUrl(),
      fetchFunction: lightspeedFetch,
    });
  }

  return lightspeedClient;
};
