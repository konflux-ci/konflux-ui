import type { IRequestOptions } from '@redhat-cloud-services/ai-client-common';
import { LightspeedClient } from '@redhat-cloud-services/lightspeed-client';

type LightspeedRequestClient = {
  makeRequest<T = void>(urlOrPath: string, options?: RequestInit): Promise<T>;
};

/**
 * Konflux Lightspeed client extensions for API endpoints not yet exposed by
 * `@redhat-cloud-services/lightspeed-client` (e.g. conversation rename via `topic_summary`).
 *
 * Rename/update is implemented via a direct PUT request until upstream lands:
 * https://github.com/RedHatInsights/ai-web-clients/pull/18
 */
export class KonfluxLightspeedClient extends LightspeedClient {
  async updateConversationTopicSummary(
    conversationId: string,
    topicSummary: string,
    options?: IRequestOptions,
  ): Promise<void> {
    // Direct request workaround — see PR above for the official `updateConversation()` method.
    await (this as unknown as LightspeedRequestClient).makeRequest(
      `/v1/conversations/${encodeURIComponent(conversationId)}`,
      {
        method: 'PUT',
        body: JSON.stringify({ ['topic_summary']: topicSummary }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: options?.signal,
      },
    );
  }
}
