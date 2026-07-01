import { LIGHTSPEED_API_BASE } from './consts';
import type {
  LightspeedConversationResponse,
  LightspeedConversationUpdateRequest,
  LightspeedConversationUpdateResponse,
  LightspeedConversationsListResponse,
  LightspeedQueryRequest,
  LightspeedStreamingEndData,
  LightspeedStreamingEventPayload,
  LightspeedStreamingQueryCallbacks,
  LightspeedStreamingQueryResult,
  LightspeedStreamingStartData,
  LightspeedStreamingTokenData,
  LightspeedStreamingTurnCompleteData,
} from './types';
import { parseLightspeedError } from './utils';

const QUERY_PAYLOAD_KEYS = {
  conversationId: 'conversation_id',
  generateTopicSummary: 'generate_topic_summary',
} as const;

const UPDATE_PAYLOAD_KEYS = {
  topicSummary: 'topic_summary',
} as const;

const serializeQueryRequest = (request: LightspeedQueryRequest): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    query: request.query,
    [QUERY_PAYLOAD_KEYS.generateTopicSummary]: request.generateTopicSummary ?? true,
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

const lightspeedFetchJson = async <TResult>(
  path: string,
  init: RequestInit = {},
): Promise<TResult> => {
  const response = await lightspeedRequest(path, init);

  if (response.status === 204) {
    throw new Error('Unexpected empty response from Lightspeed API');
  }

  return (await response.json()) as TResult;
};

const lightspeedFetchNoContent = async (path: string, init: RequestInit = {}): Promise<void> => {
  await lightspeedRequest(path, init);
};

export const listConversations = (): Promise<LightspeedConversationsListResponse> =>
  lightspeedFetchJson<LightspeedConversationsListResponse>('/v1/conversations');

export const getConversation = (
  conversationId: string,
  signal?: AbortSignal,
): Promise<LightspeedConversationResponse> =>
  lightspeedFetchJson<LightspeedConversationResponse>(
    `/v1/conversations/${encodeURIComponent(conversationId)}`,
    { signal },
  );

export const deleteConversation = (conversationId: string): Promise<void> =>
  lightspeedFetchNoContent(`/v1/conversations/${encodeURIComponent(conversationId)}`, {
    method: 'DELETE',
  });

export const updateConversationTopicSummary = (
  conversationId: string,
  request: LightspeedConversationUpdateRequest,
): Promise<LightspeedConversationUpdateResponse> =>
  lightspeedFetchJson<LightspeedConversationUpdateResponse>(
    `/v1/conversations/${encodeURIComponent(conversationId)}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serializeUpdateRequest(request)),
    },
  );

const SSE_DATA_PREFIX = 'data: ';

const parseStreamingEvent = (line: string): LightspeedStreamingEventPayload | null => {
  const trimmedLine = line.trim();
  if (!trimmedLine.startsWith(SSE_DATA_PREFIX)) {
    return null;
  }

  try {
    return JSON.parse(trimmedLine.slice(SSE_DATA_PREFIX.length)) as LightspeedStreamingEventPayload;
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
  event: LightspeedStreamingEventPayload,
  callbacks: LightspeedStreamingQueryCallbacks,
  state: {
    conversationId: string | null;
    response: string;
  },
): Promise<void> => {
  switch (event.event) {
    case 'start': {
      const data = event.data as LightspeedStreamingStartData;
      state.conversationId = data.conversation_id;
      callbacks.onStart?.({
        conversationId: data.conversation_id,
        requestId: data.request_id,
      });
      break;
    }
    case 'token': {
      const data = event.data as LightspeedStreamingTokenData;
      state.response += data.token;
      callbacks.onToken?.(data.token);
      if (data.token) {
        await yieldToBrowser();
      }
      break;
    }
    case 'turn_complete': {
      const data = event.data as LightspeedStreamingTurnCompleteData;
      state.response = data.token;
      callbacks.onTurnComplete?.(data.token);
      await yieldToBrowser();
      break;
    }
    case 'end': {
      callbacks.onEnd?.(event.data as LightspeedStreamingEndData);
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
      endData = event.data as LightspeedStreamingEndData;
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
    referencedDocuments: endData?.referenced_documents,
    truncated: endData?.truncated,
    inputTokens: endData?.input_tokens,
    outputTokens: endData?.output_tokens,
  };
};

export const streamingQuery = async (
  request: LightspeedQueryRequest,
  callbacks: LightspeedStreamingQueryCallbacks = {},
  signal?: AbortSignal,
): Promise<LightspeedStreamingQueryResult> => {
  const response = await fetch(`${LIGHTSPEED_API_BASE}/v1/streaming_query`, {
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
