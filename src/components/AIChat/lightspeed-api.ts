import { LIGHTSPEED_API_BASE } from './consts';
import type {
  LightspeedConversationResponse,
  LightspeedConversationsListResponse,
  LightspeedQueryRequest,
  LightspeedQueryResponse,
} from './types';
import { parseLightspeedError } from './utils';

const QUERY_PAYLOAD_KEYS = {
  conversationId: 'conversation_id',
  generateTopicSummary: 'generate_topic_summary',
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
): Promise<LightspeedConversationResponse> =>
  lightspeedFetchJson<LightspeedConversationResponse>(
    `/v1/conversations/${encodeURIComponent(conversationId)}`,
  );

export const deleteConversation = (conversationId: string): Promise<void> =>
  lightspeedFetchNoContent(`/v1/conversations/${encodeURIComponent(conversationId)}`, {
    method: 'DELETE',
  });

export const query = (
  request: LightspeedQueryRequest,
  signal?: AbortSignal,
): Promise<LightspeedQueryResponse> =>
  lightspeedFetchJson<LightspeedQueryResponse>('/v1/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(serializeQueryRequest(request)),
    signal,
  });
