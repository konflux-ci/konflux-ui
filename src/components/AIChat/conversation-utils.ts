import type { ConversationDetails } from '@redhat-cloud-services/lightspeed-client';
import { TEMP_CONVERSATION_ID as LIGHTSPEED_TEMP_CONVERSATION_ID } from '@redhat-cloud-services/lightspeed-client';
import type { LightspeedConversationDetails } from '~/lightspeed/types';

/**
 * Unexported `TEMP_CONVERSATION_ID` in
 * `@redhat-cloud-services/ai-client-state` `src/lib/state-manager.js`.
 * Distinct from Lightspeed's exported temp conversation id.
 */
const STATE_TEMP_CONVERSATION_ID = '__temp_conversation__';

export const isTemporaryConversationId = (conversationId?: string): boolean =>
  !conversationId ||
  conversationId === STATE_TEMP_CONVERSATION_ID ||
  conversationId === LIGHTSPEED_TEMP_CONVERSATION_ID;

/**
 * List items are `ConversationDetails` from `@redhat-cloud-services/lightspeed-client`,
 * including `topic_summary` (https://github.com/RedHatInsights/ai-web-clients/pull/5).
 */
const hasHistoryTimestamp = (
  conversation: ConversationDetails,
): conversation is ConversationDetails & {
  conversation_id: string;
  last_message_at: string;
} => Boolean(conversation.conversation_id && conversation.last_message_at);

/** Map Lightspeed list responses into camelCase history details. */
export const mapConversationDetails = (
  conversations: ConversationDetails[],
): LightspeedConversationDetails[] =>
  conversations.filter(hasHistoryTimestamp).map(
    ({
      conversation_id: conversationId,
      created_at: createdAt,
      last_message_at: lastMessageAt,
      message_count: messageCount,
      last_used_model: lastUsedModel,
      last_used_provider: lastUsedProvider,
      topic_summary: topicSummary,
    }) => ({
      conversationId,
      createdAt: createdAt ?? lastMessageAt,
      lastMessageAt,
      messageCount: messageCount ?? 0,
      ...(lastUsedModel ? { lastUsedModel } : {}),
      ...(lastUsedProvider ? { lastUsedProvider } : {}),
      ...(topicSummary ? { topicSummary } : {}),
    }),
  );
