import type { Attachment } from '@redhat-cloud-services/lightspeed-client';

let pendingAttachments: Attachment[] | undefined;

export const setPendingLightspeedAttachments = (
  attachments: Attachment[] | undefined,
): void => {
  pendingAttachments = attachments && attachments.length > 0 ? attachments : undefined;
};

export const getPendingLightspeedAttachments = (): Attachment[] | undefined =>
  pendingAttachments;

export const clearPendingLightspeedAttachments = (): void => {
  pendingAttachments = undefined;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isLightspeedQueryUrl = (url: string): boolean =>
  url.includes('/v1/streaming_query') || /\/v1\/query(?:\?|$)/.test(url);

const requestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
};

/**
 * Merge opt-in page-context attachments into Lightspeed query POST bodies.
 * The upstream client does not forward `attachments` on `sendMessage`.
 */
export const mergeAttachmentsIntoFetchInit = (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
): RequestInit | undefined => {
  if (!pendingAttachments?.length || !init?.body || typeof init.body !== 'string') {
    return init;
  }

  const method = (init.method ?? 'GET').toUpperCase();
  if (method !== 'POST' || !isLightspeedQueryUrl(requestUrl(input))) {
    return init;
  }

  try {
    const payload: unknown = JSON.parse(init.body);
    if (!isRecord(payload)) {
      return init;
    }

    return {
      ...init,
      body: JSON.stringify({
        ...payload,
        attachments: pendingAttachments,
      }),
    };
  } catch {
    return init;
  }
};
