export const DEFAULT_SERVICE_UNAVAILABLE_MESSAGE =
  'The required page is not available on the cluster.';

export const SERVICE_UNAVAILABLE_MESSAGES: Record<string, string> = {
  'issues': 'Issues dashboard is unavailable on the cluster.',
};

export const getServiceUnavailableMessage = (pageName: string | null | undefined): string => {
  if (!pageName) {
    return DEFAULT_SERVICE_UNAVAILABLE_MESSAGE;
  }

  return SERVICE_UNAVAILABLE_MESSAGES[pageName] ?? DEFAULT_SERVICE_UNAVAILABLE_MESSAGE;
};
