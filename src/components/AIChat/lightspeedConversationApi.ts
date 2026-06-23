import { LIGHTSPEED_API_BASE, lightspeedVersionedPath } from '~/components/AIChat/consts';
import { getUserFacingLightspeedErrorMessage } from '~/components/AIChat/utils';
import { logger } from '~/monitoring/logger';

export type LightspeedConversationUpdateRequest = {
  topicSummary: string;
};

const buildConversationPath = (conversationId: string): string =>
  `${lightspeedVersionedPath('/conversations')}/${encodeURIComponent(conversationId)}`;

export const updateConversationTopicSummary = async (
  conversationId: string,
  request: LightspeedConversationUpdateRequest,
): Promise<void> => {
  const response = await fetch(`${LIGHTSPEED_API_BASE}${buildConversationPath(conversationId)}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ['topic_summary']: request.topicSummary }),
  });

  if (!response.ok) {
    logger.warn('Lightspeed conversation rename failed', {
      conversationId,
      status: response.status,
      statusText: response.statusText,
    });
    throw new Error(getUserFacingLightspeedErrorMessage(response.status));
  }
};
