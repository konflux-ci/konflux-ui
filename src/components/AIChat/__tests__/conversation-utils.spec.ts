import {
  TEMP_CONVERSATION_ID as LIGHTSPEED_TEMP_CONVERSATION_ID,
  type ConversationDetails,
} from '@redhat-cloud-services/lightspeed-client';
import {
  isTemporaryConversationId,
  mapConversationDetails,
} from '~/components/AIChat/conversation-utils';

const wireField = {
  id: 'conversation_id',
  createdAt: 'created_at',
  lastMessageAt: 'last_message_at',
  messageCount: 'message_count',
  topicSummary: 'topic_summary',
  lastUsedModel: 'last_used_model',
  lastUsedProvider: 'last_used_provider',
} as const;

const wireConversation = (input: {
  id?: string | null;
  createdAt?: string | null;
  lastMessageAt?: string | null;
  messageCount?: number | null;
  topicSummary?: string;
  lastUsedModel?: string;
  lastUsedProvider?: string;
}): ConversationDetails => {
  const conversation: Record<string, unknown> = {};
  conversation[wireField.id] = input.id;
  conversation[wireField.createdAt] = input.createdAt;
  conversation[wireField.lastMessageAt] = input.lastMessageAt;
  conversation[wireField.messageCount] = input.messageCount;
  conversation[wireField.topicSummary] = input.topicSummary;
  conversation[wireField.lastUsedModel] = input.lastUsedModel;
  conversation[wireField.lastUsedProvider] = input.lastUsedProvider;
  return conversation as unknown as ConversationDetails;
};

describe('isTemporaryConversationId', () => {
  it('treats missing ids and both temp conversation ids as temporary', () => {
    expect(isTemporaryConversationId()).toBe(true);
    expect(isTemporaryConversationId('')).toBe(true);
    expect(isTemporaryConversationId('__temp_conversation__')).toBe(true);
    expect(isTemporaryConversationId(LIGHTSPEED_TEMP_CONVERSATION_ID)).toBe(true);
  });

  it('keeps real conversation ids', () => {
    expect(isTemporaryConversationId('conversation-1')).toBe(false);
  });
});

describe('mapConversationDetails', () => {
  it('maps wire conversations and drops entries without a history timestamp', () => {
    expect(
      mapConversationDetails([
        wireConversation({
          id: 'older',
          createdAt: '2026-01-01T00:00:00.000Z',
          lastMessageAt: '2026-01-01T00:00:00.000Z',
          messageCount: 2,
          topicSummary: 'Pipeline failure',
          lastUsedModel: 'model-a',
          lastUsedProvider: 'provider-a',
        }),
        wireConversation({
          id: 'newer',
          createdAt: null,
          lastMessageAt: '2026-02-01T00:00:00.000Z',
          messageCount: null,
        }),
        wireConversation({
          id: 'missing-time',
          createdAt: '2026-03-01T00:00:00.000Z',
          lastMessageAt: null,
          messageCount: 1,
        }),
      ]),
    ).toEqual([
      {
        conversationId: 'older',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastMessageAt: '2026-01-01T00:00:00.000Z',
        messageCount: 2,
        lastUsedModel: 'model-a',
        lastUsedProvider: 'provider-a',
        topicSummary: 'Pipeline failure',
      },
      {
        conversationId: 'newer',
        createdAt: '2026-02-01T00:00:00.000Z',
        lastMessageAt: '2026-02-01T00:00:00.000Z',
        messageCount: 0,
      },
    ]);
  });
});
