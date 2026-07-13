import { LIGHTSPEED_API_BASE, lightspeedVersionedPath } from './consts';
import type {
  LightspeedChatMessage,
  LightspeedConversationDetails,
  LightspeedConversationResponse,
  LightspeedConversationTurn,
  LightspeedConversationUpdateRequest,
  LightspeedConversationUpdateResponse,
  LightspeedConversationsListResponse,
  LightspeedQueryRequest,
  LightspeedQueryResponse,
  LightspeedStreamingEndData,
  LightspeedStreamingQueryCallbacks,
  LightspeedStreamingQueryResult,
} from './types';
import { parseLightspeedError } from './utils';

const QUERY_PAYLOAD_KEYS = {
  conversationId: 'conversation_id',
  generateTopicSummary: 'generate_topic_summary',
} as const;

const UPDATE_PAYLOAD_KEYS = {
  topicSummary: 'topic_summary',
} as const;

type LightspeedChatMessageWire = {
  content: string;
  type: 'user' | 'assistant';
  referenced_documents?: unknown;
};

type LightspeedConversationTurnWire = {
  messages: LightspeedChatMessageWire[];
  tool_calls?: unknown[];
  tool_results?: unknown[];
  provider?: string;
  model?: string;
  started_at?: string;
  completed_at?: string;
};

type LightspeedConversationDetailsWire = {
  conversation_id: string;
  created_at: string;
  last_message_at: string;
  message_count: number;
  last_used_model?: string;
  last_used_provider?: string;
  topic_summary?: string;
};

type LightspeedConversationsListResponseWire = {
  conversations: LightspeedConversationDetailsWire[];
};

type LightspeedConversationResponseWire = {
  conversation_id: string;
  chat_history: LightspeedConversationTurnWire[];
};

type LightspeedQueryResponseWire = {
  conversation_id: string;
  response: string;
  referenced_documents?: unknown[];
  truncated?: boolean;
  input_tokens?: number;
  output_tokens?: number;
};

type LightspeedConversationUpdateResponseWire = {
  conversation_id: string;
  success: boolean;
  message: string;
};

const parseChatMessage = (wire: LightspeedChatMessageWire): LightspeedChatMessage => ({
  content: wire.content,
  type: wire.type,
  ...(wire.referenced_documents !== undefined
    ? { referencedDocuments: wire.referenced_documents }
    : {}),
});

const parseConversationTurn = (wire: LightspeedConversationTurnWire): LightspeedConversationTurn => ({
  messages: wire.messages.map(parseChatMessage),
  ...(wire.tool_calls !== undefined ? { toolCalls: wire.tool_calls } : {}),
  ...(wire.tool_results !== undefined ? { toolResults: wire.tool_results } : {}),
  ...(wire.provider !== undefined ? { provider: wire.provider } : {}),
  ...(wire.model !== undefined ? { model: wire.model } : {}),
  ...(wire.started_at !== undefined ? { startedAt: wire.started_at } : {}),
  ...(wire.completed_at !== undefined ? { completedAt: wire.completed_at } : {}),
});

const parseConversationDetails = (
  wire: LightspeedConversationDetailsWire,
): LightspeedConversationDetails => ({
  conversationId: wire.conversation_id,
  createdAt: wire.created_at,
  lastMessageAt: wire.last_message_at,
  messageCount: wire.message_count,
  ...(wire.last_used_model !== undefined ? { lastUsedModel: wire.last_used_model } : {}),
  ...(wire.last_used_provider !== undefined ? { lastUsedProvider: wire.last_used_provider } : {}),
  ...(wire.topic_summary !== undefined ? { topicSummary: wire.topic_summary } : {}),
});

const parseConversationsListResponse = (
  wire: LightspeedConversationsListResponseWire,
): LightspeedConversationsListResponse => ({
  conversations: wire.conversations.map(parseConversationDetails),
});

const parseConversationResponse = (
  wire: LightspeedConversationResponseWire,
): LightspeedConversationResponse => ({
  conversationId: wire.conversation_id,
  chatHistory: wire.chat_history.map(parseConversationTurn),
});

const parseQueryResponse = (wire: LightspeedQueryResponseWire): LightspeedQueryResponse => ({
  conversationId: wire.conversation_id,
  response: wire.response,
  ...(wire.referenced_documents !== undefined
    ? { referencedDocuments: wire.referenced_documents }
    : {}),
  ...(wire.truncated !== undefined ? { truncated: wire.truncated } : {}),
  ...(wire.input_tokens !== undefined ? { inputTokens: wire.input_tokens } : {}),
  ...(wire.output_tokens !== undefined ? { outputTokens: wire.output_tokens } : {}),
});

const parseConversationUpdateResponse = (
  wire: LightspeedConversationUpdateResponseWire,
): LightspeedConversationUpdateResponse => ({
  conversationId: wire.conversation_id,
  success: wire.success,
  message: wire.message,
});

const serializeQueryRequest = (request: LightspeedQueryRequest): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    query: request.query,
    [QUERY_PAYLOAD_KEYS.generateTopicSummary]: request.generateTopicSummary,
  };

  if (request.conversationId !== undefined) {
    payload[QUERY_PAYLOAD_KEYS.conversationId] = request.conversationId;
  }

  return payload;
};

const serializeUpdateRequest = (
  request: LightspeedConversationUpdateRequest,
): Record<string, unknown> => ({
  [UPDATE_PAYLOAD_KEYS.topicSummary]: request.topicSummary,
});

const buildConversationPath = (conversationId: string): string =>
  `${lightspeedVersionedPath('/conversations')}/${encodeURIComponent(conversationId)}`;

const lightspeedRequest = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const response = await fetch(`${LIGHTSPEED_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(await parseLightspeedError(response));
  }

  return response;
};

const parseJsonResponse = async <TResult>(response: Response): Promise<TResult> => {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error('Unexpected empty response from Lightspeed API');
  }

  try {
    return JSON.parse(text) as TResult;
  } catch {
    throw new Error('Invalid JSON response from Lightspeed API');
  }
};

const lightspeedFetchJson = async <TWire, TResult>(
  path: string,
  parse: (wire: TWire) => TResult,
  init: RequestInit = {},
): Promise<TResult> => {
  const response = await lightspeedRequest(path, init);
  const wire = await parseJsonResponse<TWire>(response);
  return parse(wire);
};

const lightspeedFetchNoContent = async (path: string, init: RequestInit = {}): Promise<void> => {
  const response = await lightspeedRequest(path, init);

  if (response.status === 204) {
    return;
  }

  const text = await response.text();
  if (text.trim()) {
    throw new Error('Unexpected response body from Lightspeed API');
  }
};

export const listConversations = (
  signal?: AbortSignal,
): Promise<LightspeedConversationsListResponse> =>
  lightspeedFetchJson<LightspeedConversationsListResponseWire, LightspeedConversationsListResponse>(
    lightspeedVersionedPath('/conversations'),
    parseConversationsListResponse,
    { signal },
  );

export const getConversation = (
  conversationId: string,
  signal?: AbortSignal,
): Promise<LightspeedConversationResponse> =>
  lightspeedFetchJson<LightspeedConversationResponseWire, LightspeedConversationResponse>(
    buildConversationPath(conversationId),
    parseConversationResponse,
    { signal },
  );

export const deleteConversation = (conversationId: string): Promise<void> =>
  lightspeedFetchNoContent(buildConversationPath(conversationId), {
    method: 'DELETE',
  });

export const updateConversationTopicSummary = (
  conversationId: string,
  request: LightspeedConversationUpdateRequest,
): Promise<LightspeedConversationUpdateResponse> =>
  lightspeedFetchJson<
    LightspeedConversationUpdateResponseWire,
    LightspeedConversationUpdateResponse
  >(buildConversationPath(conversationId), parseConversationUpdateResponse, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(serializeUpdateRequest(request)),
  });

export const query = (
  request: LightspeedQueryRequest,
  signal?: AbortSignal,
): Promise<LightspeedQueryResponse> =>
  lightspeedFetchJson<LightspeedQueryResponseWire, LightspeedQueryResponse>(
    lightspeedVersionedPath('/query'),
    parseQueryResponse,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serializeQueryRequest(request)),
      signal,
    },
  );

type LightspeedStreamingEventName = 'start' | 'token' | 'turn_complete' | 'end' | 'error';

type LightspeedStreamingStartDataWire = {
  conversation_id: string;
  request_id: string;
};

type LightspeedStreamingTokenDataWire = {
  id: number;
  token: string;
};

type LightspeedStreamingTurnCompleteDataWire = {
  id?: number;
  token: string;
};

type LightspeedStreamingEndDataWire = {
  referenced_documents?: unknown[];
  truncated?: boolean | null;
  input_tokens?: number;
  output_tokens?: number;
};

type LightspeedStreamingEventPayloadWire = {
  event: LightspeedStreamingEventName;
  data:
    | LightspeedStreamingStartDataWire
    | LightspeedStreamingTokenDataWire
    | LightspeedStreamingTurnCompleteDataWire
    | LightspeedStreamingEndDataWire
    | { message?: string };
};

const parseStreamingEndData = (wire: LightspeedStreamingEndDataWire): LightspeedStreamingEndData => ({
  ...(wire.referenced_documents !== undefined
    ? { referencedDocuments: wire.referenced_documents }
    : {}),
  ...(wire.truncated !== undefined ? { truncated: wire.truncated } : {}),
  ...(wire.input_tokens !== undefined ? { inputTokens: wire.input_tokens } : {}),
  ...(wire.output_tokens !== undefined ? { outputTokens: wire.output_tokens } : {}),
});

const SSE_DATA_PREFIX = 'data: ';

const parseStreamingEvent = (line: string): LightspeedStreamingEventPayloadWire | null => {
  const trimmedLine = line.trim();
  if (!trimmedLine.startsWith(SSE_DATA_PREFIX)) {
    return null;
  }

  try {
    return JSON.parse(trimmedLine.slice(SSE_DATA_PREFIX.length)) as LightspeedStreamingEventPayloadWire;
  } catch {
    return null;
  }
};

const yieldToBrowser = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });

const handleStreamingEvent = async (
  event: LightspeedStreamingEventPayloadWire,
  callbacks: LightspeedStreamingQueryCallbacks,
  state: {
    conversationId: string | null;
    response: string;
  },
): Promise<void> => {
  switch (event.event) {
    case 'start': {
      const data = event.data as LightspeedStreamingStartDataWire;
      state.conversationId = data.conversation_id;
      callbacks.onStart?.({
        conversationId: data.conversation_id,
        requestId: data.request_id,
      });
      break;
    }
    case 'token': {
      const data = event.data as LightspeedStreamingTokenDataWire;
      state.response += data.token;
      callbacks.onToken?.(data.token);
      if (data.token) {
        await yieldToBrowser();
      }
      break;
    }
    case 'turn_complete': {
      const data = event.data as LightspeedStreamingTurnCompleteDataWire;
      state.response = data.token;
      callbacks.onTurnComplete?.(data.token);
      await yieldToBrowser();
      break;
    }
    case 'end': {
      callbacks.onEnd?.(parseStreamingEndData(event.data as LightspeedStreamingEndDataWire));
      break;
    }
    case 'error': {
      const data = event.data as { message?: string };
      throw new Error(data.message ?? 'Streaming query failed');
    }
    default:
      break;
  }
};

const consumeStreamingResponse = async (
  response: Response,
  callbacks: LightspeedStreamingQueryCallbacks,
  signal?: AbortSignal,
): Promise<LightspeedStreamingQueryResult> => {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Streaming response body is unavailable');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  const state = {
    conversationId: null as string | null,
    response: '',
  };
  let endData: LightspeedStreamingEndData | undefined;

  const processBufferLine = async (line: string): Promise<void> => {
    const event = parseStreamingEvent(line);
    if (!event) {
      return;
    }

    if (event.event === 'end') {
      endData = parseStreamingEndData(event.data as LightspeedStreamingEndDataWire);
    }

    await handleStreamingEvent(event, callbacks, state);
  };

  try {
    let streamDone = false;
    while (!streamDone) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      const { done, value } = await reader.read();
      streamDone = done;
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        await processBufferLine(line);
        newlineIndex = buffer.indexOf('\n');
      }
    }

    if (buffer.trim()) {
      await processBufferLine(buffer);
    }
  } finally {
    reader.releaseLock();
  }

  if (!state.conversationId) {
    throw new Error('Streaming query completed without a conversation id');
  }

  return {
    conversationId: state.conversationId,
    response: state.response,
    ...(endData?.referencedDocuments !== undefined
      ? { referencedDocuments: endData.referencedDocuments }
      : {}),
    ...(endData?.truncated !== undefined ? { truncated: endData.truncated } : {}),
    ...(endData?.inputTokens !== undefined ? { inputTokens: endData.inputTokens } : {}),
    ...(endData?.outputTokens !== undefined ? { outputTokens: endData.outputTokens } : {}),
  };
};

export const streamingQuery = async (
  request: LightspeedQueryRequest,
  callbacks: LightspeedStreamingQueryCallbacks = {},
  signal?: AbortSignal,
): Promise<LightspeedStreamingQueryResult> => {
  const response = await fetch(`${LIGHTSPEED_API_BASE}${lightspeedVersionedPath('/streaming_query')}`, {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(serializeQueryRequest(request)),
    signal,
  });

  if (!response.ok) {
    throw new Error(await parseLightspeedError(response));
  }

  return consumeStreamingResponse(response, callbacks, signal);
};
