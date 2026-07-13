export type LightspeedChatMessage = {
  content: string;
  type: 'user' | 'assistant';
  referencedDocuments?: unknown;
};

export type LightspeedConversationTurn = {
  messages: LightspeedChatMessage[];
  toolCalls?: unknown[];
  toolResults?: unknown[];
  provider?: string;
  model?: string;
  startedAt?: string;
  completedAt?: string;
};

export type LightspeedConversationDetails = {
  conversationId: string;
  createdAt: string;
  lastMessageAt: string;
  messageCount: number;
  lastUsedModel?: string;
  lastUsedProvider?: string;
  topicSummary?: string;
};

export type LightspeedConversationsListResponse = {
  conversations: LightspeedConversationDetails[];
};

export type LightspeedConversationResponse = {
  conversationId: string;
  chatHistory: LightspeedConversationTurn[];
};

export type LightspeedQueryRequest = {
  query: string;
  conversationId?: string;
  generateTopicSummary: boolean;
};

export type LightspeedQueryResponse = {
  conversationId: string;
  response: string;
  referencedDocuments?: unknown[];
  truncated?: boolean;
  inputTokens?: number;
  outputTokens?: number;
};

export type LightspeedStreamingEventName = 'start' | 'token' | 'turn_complete' | 'end' | 'error';

export type LightspeedStreamingQueryResult = {
  conversationId: string;
  response: string;
  referencedDocuments?: unknown[];
  truncated?: boolean | null;
  inputTokens?: number;
  outputTokens?: number;
};

export type LightspeedStreamingEndData = {
  referencedDocuments?: unknown[];
  truncated?: boolean | null;
  inputTokens?: number;
  outputTokens?: number;
};

export type LightspeedStreamingQueryCallbacks = {
  onStart?: (data: { conversationId: string; requestId: string }) => void;
  onToken?: (token: string) => void;
  onTurnComplete?: (response: string) => void;
  onEnd?: (data: LightspeedStreamingEndData) => void;
};

export type LightspeedConversationUpdateRequest = {
  topicSummary: string;
};

export type LightspeedConversationUpdateResponse = {
  conversationId: string;
  success: boolean;
  message: string;
};

export type LightspeedErrorResponse = {
  detail?: {
    cause?: string;
    response?: string;
  };
};
