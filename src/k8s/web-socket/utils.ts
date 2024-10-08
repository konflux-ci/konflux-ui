import { WebSocketOptions } from './types';

export const applyConfigHost = (
  options: WebSocketOptions & { wsPrefix?: string; pathPrefix?: string },
): string => {
  return options.host as string;
};

export const createURL = (options: WebSocketOptions): string => {
  let url;

  const host = applyConfigHost(options);

  if (host === 'auto') {
    if (window.location.protocol === 'https:') {
      url = 'wss://';
    } else {
      url = 'ws://';
    }
    url += window.location.host;
  } else {
    url = host;
  }

  if (options.path) {
    url += options.path;
  }

  return url;
};

export const applyConfigSubProtocols = (
  options: WebSocketOptions & { wsPrefix?: string; pathPrefix?: string },
): undefined | string[] => {
  return options.host ? options.subProtocols : undefined;
};
