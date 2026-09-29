/**
 * Merges extra query fields into the next Lightspeed /v1/query or /v1/streaming_query body.
 * The installed client serializes only query, conversation_id, and media_type.
 */

let pendingQueryRequestFields: Record<string, unknown> | undefined;

const QUERY_PATHS = ['/v1/query', '/v1/streaming_query'];

export const setPendingQueryRequestFields = (fields: Record<string, unknown> | undefined): void => {
  pendingQueryRequestFields = fields;
};

export const takePendingQueryRequestFieldsForFetch = (): Record<string, unknown> | undefined => {
  const fields = pendingQueryRequestFields;
  pendingQueryRequestFields = undefined;
  return fields;
};

const getRequestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
};

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isLightspeedQueryRequest = (input: RequestInfo | URL, init?: RequestInit): boolean => {
  const method = init?.method?.toUpperCase() ?? 'GET';
  if (method !== 'POST') {
    return false;
  }
  const url = getRequestUrl(input);
  return QUERY_PATHS.some((path) => url.includes(path));
};

export const mergePendingFieldsIntoQueryBody = (body: string): string => {
  const fields = takePendingQueryRequestFieldsForFetch();
  if (!fields) {
    return body;
  }

  const parsed: unknown = JSON.parse(body);
  if (!isJsonObject(parsed)) {
    return body;
  }

  return JSON.stringify({ ...parsed, ...fields });
};
