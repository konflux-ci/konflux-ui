export type ApiEventAction = 'send' | 'ignore';

export interface ApiEventRule {
  name: string;
  matches: (url: string, statusCode: number) => boolean;
  action: ApiEventAction;
}

export const DEFAULT_API_EVENT_RULES: ApiEventRule[] = [
  {
    name: 'non-app-requests',
    matches: (url) => !url.startsWith('/'),
    action: 'ignore',
  },
  {
    name: 'plugin-paths-always-send',
    matches: (url) => url.includes('/plugins/'),
    action: 'send',
  },
  {
    name: 'ignore-404',
    matches: (_url, statusCode) => statusCode === 404,
    action: 'ignore',
  },
  {
    name: 'default-send',
    matches: () => true,
    action: 'send',
  },
];

export const evaluateApiEventRules = (
  url: string,
  statusCode: number,
  rules: ApiEventRule[] = DEFAULT_API_EVENT_RULES,
): ApiEventAction => {
  const matchedRule = rules.find((rule) => rule.matches(url, statusCode));
  return matchedRule?.action ?? 'send';
};
