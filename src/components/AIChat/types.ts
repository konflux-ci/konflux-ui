export type LightspeedConversationDetails = {
  conversationId: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  lastUsedModel?: string;
  lastUsedProvider?: string;
  topicSummary?: string;
};
