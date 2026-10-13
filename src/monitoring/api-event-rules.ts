export interface ApiEventRule {
  /** Human-readable name for debugging */
  name: string;
  /** Return true if this rule applies to the given URL and status */
  matches: (url: string, statusCode: number) => boolean;
  /**
   * Sample rate override for matched events.
   * 0 = discard, 1 = always send.
   * undefined = no override, use the default sampleRate from Sentry config.
   */
  sampleRate: number | undefined;
}

/**
 * Default API event rules. Evaluated in order — first match wins.
 * Rules with sampleRate override the default config rate.
 * The fallback rule returns undefined (no override).
 */
export const DEFAULT_API_EVENT_RULES: ApiEventRule[] = [
  {
    name: 'non-app-requests',
    matches: (url) => !url.startsWith('/'),
    sampleRate: 0,
  },
  {
    name: 'plugin-paths-always-send',
    matches: (url) => url.includes('/api/k8s/plugins/'),
    sampleRate: 1,
  },
  {
    name: 'ignore-404',
    matches: (_url, statusCode) => statusCode === 404,
    sampleRate: 0,
  },
  {
    name: 'default',
    matches: () => true,
    sampleRate: undefined,
  },
];

/**
 * Evaluate API event rules in order. First matching rule wins.
 * Returns the sample rate override, or undefined if no override applies.
 */
export const evaluateApiEventRules = (
  url: string,
  statusCode: number,
  rules: ApiEventRule[] = DEFAULT_API_EVENT_RULES,
): number | undefined => {
  const matchedRule = rules.find((rule) => rule.matches(url, statusCode));
  return matchedRule?.sampleRate;
};
