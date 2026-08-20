export interface ApiEventRule {
  /** Human-readable name for debugging */
  name: string;
  /** Return true if this rule applies to the given URL and status */
  matches: (url: string, statusCode: number) => boolean;
  /** Sample rate (0 = never send, 1 = always send) */
  sampleRate: number;
}

/**
 * Create the default API event rules with the given default sample rate.
 * Rules are evaluated in order — first match wins.
 */
export const createDefaultApiEventRules = (defaultSampleRate: number): ApiEventRule[] => [
  {
    name: 'non-app-requests',
    matches: (url) => !url.startsWith('/'),
    sampleRate: 0,
  },
  {
    name: 'plugin-paths-always-send',
    matches: (url) => url.includes('/plugins/'),
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
    sampleRate: defaultSampleRate,
  },
];

/**
 * Evaluate API event rules in order. First matching rule wins.
 * Returns the sample rate (0..1) for the matched rule.
 */
export const evaluateApiEventRules = (
  url: string,
  statusCode: number,
  rules: ApiEventRule[],
): number => {
  const matchedRule = rules.find((rule) => rule.matches(url, statusCode));
  return matchedRule?.sampleRate ?? 1;
};
