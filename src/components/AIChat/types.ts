export type LightspeedChatMessage = {
  content: string;
  type: 'user' | 'assistant';
  referenced_documents?: unknown;
};

export type LightspeedConversationTurn = {
  messages: LightspeedChatMessage[];
  tool_calls?: unknown[];
  tool_results?: unknown[];
  provider?: string;
  model?: string;
  started_at?: string;
  completed_at?: string;
};

export type LightspeedConversationDetails = {
  conversation_id: string;
  created_at: string;
  last_message_at: string;
  message_count: number;
  last_used_model?: string;
  last_used_provider?: string;
  topic_summary?: string;
};

export type LightspeedConversationsListResponse = {
  conversations: LightspeedConversationDetails[];
};

export type LightspeedConversationResponse = {
  conversation_id: string;
  chat_history: LightspeedConversationTurn[];
};

export type LightspeedQueryRequest = {
  query: string;
  conversationId?: string;
  generateTopicSummary?: boolean;
};

export type LightspeedStreamingEventName = 'start' | 'token' | 'turn_complete' | 'end' | 'error';

export type LightspeedStreamingStartData = {
  conversation_id: string;
  request_id: string;
};

export type LightspeedStreamingTokenData = {
  id: number;
  token: string;
};

export type LightspeedStreamingTurnCompleteData = {
  id?: number;
  token: string;
};

export type LightspeedStreamingEndData = {
  referenced_documents?: unknown[];
  truncated?: boolean | null;
  input_tokens?: number;
  output_tokens?: number;
};

export type LightspeedStreamingEventPayload = {
  event: LightspeedStreamingEventName;
  data:
    | LightspeedStreamingStartData
    | LightspeedStreamingTokenData
    | LightspeedStreamingTurnCompleteData
    | LightspeedStreamingEndData
    | { message?: string };
};

export type LightspeedStreamingQueryResult = {
  conversationId: string;
  response: string;
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
  conversation_id: string;
  success: boolean;
  message: string;
};

export type LightspeedErrorResponse = {
  detail?: {
    cause?: string;
    response?: string;
  };
};
