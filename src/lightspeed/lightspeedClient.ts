import { LightspeedClient, LightspeedClientError } from '@redhat-cloud-services/lightspeed-client';
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

/**
 * History titles come from GET /v1/conversations (database topic_summary).
 * LightspeedClient.updateConversation writes only the v2 cache.
 */
export const updateListedConversationTopicSummary = async (
  conversationId: string,
  topicSummary: string,
): Promise<void> => {
  const baseUrl = resolveLightspeedClientBaseUrl().replace(/\/$/, '');
  const response = await fetch(
    `${baseUrl}/v1/conversations/${encodeURIComponent(conversationId)}`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ['topic_summary']: topicSummary }),
    },
  );

  if (!response.ok) {
    throw new LightspeedClientError(
      response.status,
      response.statusText,
      'Failed to update conversation name',
    );
  }
};
