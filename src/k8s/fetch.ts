import { defaultsDeep } from 'lodash-es';
import { HttpError, K8sStatusError, TimeoutError } from './error';
import { isK8sStatus } from './k8s-utils';
import { applyOverrides } from './object';

type ResponseJsonError = {
  message: string;
  error: string;
  details?: { causes: { message?: string; field?: string }[] };
};

type ResourceUpdateArgs = [url: string, data: unknown, ...args: FetchOptionArgs];

type ResourceDeleteArgs = [url: string, data?: unknown, ...args: FetchOptionArgs];

const validateStatus = async (response: Response) => {
  if (response.ok) {
    return response;
  }

  if (response.status === 401) {
    throw new HttpError('Invalid token', response.status, response);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || contentType.indexOf('json') === -1) {
    throw new HttpError(response.statusText, response.status, response);
  }
  const json: ResponseJsonError = await response.json();
  if (response.status === 403) {
    throw new HttpError(
      json.message || 'Access denied due to cluster policy.',
      response.status,
      response,
      json,
    );
  }

  const cause = json.details?.causes?.[0];
  let reason;
  if (cause) {
    reason = `Error "${cause.message}" for field "${cause.field}".`;
  }
  if (!reason) {
    reason = json.message;
  }
  if (!reason) {
    reason = json.error;
  }
  if (!reason) {
    reason = response.statusText;
  }

  throw new HttpError(reason as string, response.status, response, json);
};

export const applyDefaults = <TObject>(obj: TObject, defaults: unknown): TObject =>
  defaultsDeep({}, obj, defaults);

const basicFetch = async (url: string, requestInit: RequestInit = {}): Promise<Response> => {
  try {
    return validateStatus(
      await fetch(url, applyDefaults<RequestInit>(requestInit, { method: 'GET' })),
    );
  } catch (e) {
    return Promise.reject(e);
  }
};

export type FetchOptionArgs = [
  requestInit?: RequestInit & { wsPrefix?: string; pathPrefix?: string },
  timeout?: number,
  isK8sApiRequest?: boolean,
];

type ResourceReadArgs = [url: string, ...args: FetchOptionArgs];

const defaultTimeout = 60_000;

export const commonFetch = async (
  ...[apiUrl, requestInit = {}, timeout = defaultTimeout]: ResourceReadArgs
): Promise<Response> => {
  const { pathPrefix, ...cleanRequestInit } = requestInit as RequestInit & { pathPrefix?: string };

  const url = pathPrefix ? `/api/k8s/${pathPrefix}${apiUrl}` : `/api/k8s${apiUrl}`;

  const fetchPromise = basicFetch(url, applyDefaults(cleanRequestInit, { method: 'GET' }));

  if (timeout <= 0) {
    return fetchPromise;
  }

  const timeoutPromise = new Promise<Response>((_, reject) => {
    setTimeout(() => reject(new TimeoutError(url, timeout)), timeout);
  });

  return Promise.race([fetchPromise, timeoutPromise]);
};

export const commonFetchText = async (
  ...[url, requestInit = {}, timeout = defaultTimeout]: ResourceReadArgs
): Promise<string> => {
  const response = await commonFetch(
    url,
    applyDefaults(requestInit, { headers: { Accept: 'application/json' } }),
    timeout,
  );

  const responseText = await response.text();

  return responseText ?? '';
};

export const commonFetchJSON = async <TResult>(
  ...[url, requestInit = {}, timeout = defaultTimeout, isK8sAPIRequest = false]: ResourceReadArgs
): Promise<TResult> => {
  const response = await commonFetch(
    url,
    applyDefaults(requestInit, { headers: { Accept: 'application/json' } }),
    timeout,
  );
  const responseText = await response.text();
  const data = JSON.parse(responseText) as TResult;

  if (isK8sAPIRequest && isK8sStatus(data) && data.status !== 'Success') {
    throw new K8sStatusError(data);
  }

  return data;
};

const commonFetchJSONWithBody = <TResult>(
  url: string,
  data: unknown,
  ...[requestInit = {}, timeout = defaultTimeout, isK8sAPIRequest = false]: FetchOptionArgs
) =>
  commonFetchJSON<TResult>(
    url,
    applyOverrides(requestInit, {
      headers: {
        'Content-Type': `application/${
          requestInit.method === 'PATCH' ? 'json-patch+json' : 'json'
        };charset=UTF-8`,
      },
      body: JSON.stringify(data),
    }),
    timeout,
    isK8sAPIRequest,
  );

commonFetchJSON.put = async <TResult>(
  ...[
    url,
    data,
    requestInit = {},
    timeout = defaultTimeout,
    isK8sAPIRequest = false,
  ]: ResourceUpdateArgs
): Promise<TResult> =>
  commonFetchJSONWithBody(
    url,
    data,
    applyOverrides(requestInit, { method: 'PUT' }),
    timeout,
    isK8sAPIRequest,
  );

commonFetchJSON.post = async <TResult>(
  ...[
    url,
    data,
    requestInit = {},
    timeout = defaultTimeout,
    isK8sAPIRequest = false,
  ]: ResourceUpdateArgs
): Promise<TResult> =>
  commonFetchJSONWithBody(
    url,
    data,
    applyOverrides(requestInit, { method: 'POST' }),
    timeout,
    isK8sAPIRequest,
  );

commonFetchJSON.patch = async <TResult>(
  ...[
    url,
    data,
    requestInit = {},
    timeout = defaultTimeout,
    isK8sAPIRequest = false,
  ]: ResourceUpdateArgs
): Promise<TResult> =>
  commonFetchJSONWithBody(
    url,
    data,
    applyOverrides(requestInit, { method: 'PATCH' }),
    timeout,
    isK8sAPIRequest,
  );

commonFetchJSON.delete = async <TResult>(
  ...[
    url,
    data,
    requestInit = {},
    timeout = defaultTimeout,
    isK8sAPIRequest = false,
  ]: ResourceDeleteArgs
): Promise<TResult> => {
  const requestInitOverride = applyOverrides(requestInit, { method: 'DELETE' });

  return data
    ? commonFetchJSONWithBody(url, data, requestInitOverride, timeout, isK8sAPIRequest)
    : commonFetchJSON(url, requestInitOverride, timeout, isK8sAPIRequest);
};
