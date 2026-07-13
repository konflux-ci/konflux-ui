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

const STREAMING_START_WIRE_KEYS = {
  conversationId: 'conversation_id',
  requestId: 'request_id',
} as const;

const STREAMING_END_WIRE_KEYS = {
  referencedDocuments: 'referenced_documents',
  truncated: 'truncated',
  inputTokens: 'input_tokens',
  outputTokens: 'output_tokens',
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

type ParsedStreamingEvent = {
  event: LightspeedStreamingEventName;
  data: unknown;
};

const STREAMING_EVENT_NAMES: readonly LightspeedStreamingEventName[] = [
  'start',
  'token',
  'turn_complete',
  'end',
  'error',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === 'string';

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isBooleanOrNull = (value: unknown): value is boolean | null =>
  value === null || typeof value === 'boolean';

const isUnknownArray = (value: unknown): value is unknown[] => Array.isArray(value);

const isStreamingEventName = (value: unknown): value is LightspeedStreamingEventName =>
  typeof value === 'string' &&
  (STREAMING_EVENT_NAMES as readonly string[]).includes(value);

const assertStreamingStartData = (data: unknown): LightspeedStreamingStartDataWire => {
  const conversationIdKey = STREAMING_START_WIRE_KEYS.conversationId;
  const requestIdKey = STREAMING_START_WIRE_KEYS.requestId;

  if (!isRecord(data) || !isString(data[conversationIdKey]) || !isString(data[requestIdKey])) {
    throw new Error('Invalid streaming start event payload');
  }

  return {
    [conversationIdKey]: data[conversationIdKey],
    [requestIdKey]: data[requestIdKey],
  };
};

const assertStreamingTokenData = (data: unknown): LightspeedStreamingTokenDataWire => {
  if (!isRecord(data) || !isNumber(data.id) || !isString(data.token)) {
    throw new Error('Invalid streaming token event payload');
  }

  return {
    id: data.id,
    token: data.token,
  };
};

const assertStreamingTurnCompleteData = (data: unknown): LightspeedStreamingTurnCompleteDataWire => {
  if (!isRecord(data) || !isString(data.token)) {
    throw new Error('Invalid streaming turn_complete event payload');
  }

  return {
    token: data.token,
    ...(isNumber(data.id) ? { id: data.id } : {}),
  };
};

const assertStreamingEndDataWire = (data: unknown): LightspeedStreamingEndDataWire => {
  if (!isRecord(data)) {
    throw new Error('Invalid streaming end event payload');
  }

  const referencedDocumentsKey = STREAMING_END_WIRE_KEYS.referencedDocuments;
  const inputTokensKey = STREAMING_END_WIRE_KEYS.inputTokens;
  const outputTokensKey = STREAMING_END_WIRE_KEYS.outputTokens;
  const truncatedKey = STREAMING_END_WIRE_KEYS.truncated;

  let referencedDocuments: unknown[] | undefined;
  if (referencedDocumentsKey in data) {
    if (data[referencedDocumentsKey] === undefined) {
      referencedDocuments = undefined;
    } else if (!isUnknownArray(data[referencedDocumentsKey])) {
      throw new Error('Invalid referenced_documents in streaming end event payload');
    } else {
      referencedDocuments = data[referencedDocumentsKey];
    }
  }

  let truncated: boolean | null | undefined;
  if (truncatedKey in data) {
    if (data[truncatedKey] === undefined) {
      truncated = undefined;
    } else if (!isBooleanOrNull(data[truncatedKey])) {
      throw new Error('Invalid truncated value in streaming end event payload');
    } else {
      truncated = data[truncatedKey];
    }
  }

  let inputTokens: number | undefined;
  if (inputTokensKey in data) {
    if (data[inputTokensKey] === undefined) {
      inputTokens = undefined;
    } else if (!isNumber(data[inputTokensKey])) {
      throw new Error('Invalid input_tokens in streaming end event payload');
    } else {
      inputTokens = data[inputTokensKey];
    }
  }

  let outputTokens: number | undefined;
  if (outputTokensKey in data) {
    if (data[outputTokensKey] === undefined) {
      outputTokens = undefined;
    } else if (!isNumber(data[outputTokensKey])) {
      throw new Error('Invalid output_tokens in streaming end event payload');
    } else {
      outputTokens = data[outputTokensKey];
    }
  }

  return {
    ...(referencedDocuments !== undefined ? { [referencedDocumentsKey]: referencedDocuments } : {}),
    ...(truncated !== undefined ? { [truncatedKey]: truncated } : {}),
    ...(inputTokens !== undefined ? { [inputTokensKey]: inputTokens } : {}),
    ...(outputTokens !== undefined ? { [outputTokensKey]: outputTokens } : {}),
  };
};

const assertStreamingErrorData = (data: unknown): { message?: string } => {
  if (!isRecord(data)) {
    throw new Error('Invalid streaming error event payload');
  }

  if (data.message !== undefined && !isString(data.message)) {
    throw new Error('Invalid message in streaming error event payload');
  }

  return {
    ...(isString(data.message) ? { message: data.message } : {}),
  };
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

const parseStreamingEvent = (line: string): ParsedStreamingEvent | null => {
  const trimmedLine = line.trim();
  if (!trimmedLine.startsWith(SSE_DATA_PREFIX)) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(trimmedLine.slice(SSE_DATA_PREFIX.length));

    if (!isRecord(parsed) || !isStreamingEventName(parsed.event)) {
      return null;
    }

    return {
      event: parsed.event,
      data: parsed.data,
    };
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
  event: ParsedStreamingEvent,
  callbacks: LightspeedStreamingQueryCallbacks,
  state: {
    conversationId: string | null;
    response: string;
  },
): Promise<void> => {
  switch (event.event) {
    case 'start': {
      const data = assertStreamingStartData(event.data);
      state.conversationId = data.conversation_id;
      callbacks.onStart?.({
        conversationId: data.conversation_id,
        requestId: data.request_id,
      });
      break;
    }
    case 'token': {
      const data = assertStreamingTokenData(event.data);
      state.response += data.token;
      callbacks.onToken?.(data.token);
      if (data.token) {
        await yieldToBrowser();
      }
      break;
    }
    case 'turn_complete': {
      const data = assertStreamingTurnCompleteData(event.data);
      state.response = data.token;
      callbacks.onTurnComplete?.(data.token);
      await yieldToBrowser();
      break;
    }
    case 'end': {
      callbacks.onEnd?.(parseStreamingEndData(assertStreamingEndDataWire(event.data)));
      break;
    }
    case 'error': {
      const data = assertStreamingErrorData(event.data);
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
      endData = parseStreamingEndData(assertStreamingEndDataWire(event.data));
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

    buffer += decoder.decode();

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
