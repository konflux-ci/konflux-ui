import { createParser } from 'nuqs';

/**
 * nuqs parser for comma-separated string arrays.
 *
 * Serializes `['a', 'b']` as `"a,b"` in the URL. Values containing commas
 * are not expected — filter chip values are user-typed short strings.
 */
export const parseAsCommaSeparated = createParser<string[]>({
  parse: (value) => (value ? value.split(',').filter(Boolean) : []),
  serialize: (value) => value.join(','),
}).withDefault([]);
