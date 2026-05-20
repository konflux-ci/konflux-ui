export type TextFilterOptions = {
  caseSensitive?: boolean;
  trim?: boolean;
  /** Use subsequence (fuzzy) matching: all characters of the search term must
   *  appear in order within the value, but not necessarily contiguously.
   *  E.g. "cbp" matches "component-build-pipeline". Defaults to `false`. */
  fuzzy?: boolean;
};

type Searchable = string | number | boolean | null | undefined;

/**
 * Safely coerces a primitive value to a string for text comparison.
 */
const toSearchableString = (value: Searchable): string => {
  if (value === null) {
    return '';
  }

  if (value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return String(value);
};

/**
 * Subsequence match: every character in `search` appears in `text` in order,
 * but not necessarily contiguously. Both strings must already be in the
 * desired case before calling this.
 */
const subsequenceMatch = (text: string, search: string): boolean => {
  let si = 0;

  for (let ti = 0; ti < text.length && si < search.length; ti++) {
    if (text[ti] === search[si]) {
      si++;
    }
  }

  return si === search.length;
};

/**
 * Checks whether a **value** matches a **search term** based on the provided options.
 *
 * Key behaviours:
 * - Non-string values (numbers, booleans, `null`, `undefined`) are coerced to
 *   a string before comparison, so calling code never has to worry about runtime
 *   errors from e.g. `(42).toLowerCase()`.
 * - An empty (or whitespace-only, when `trim` is enabled) search term matches
 *   everything.
 * - When `fuzzy` is true, uses subsequence matching: all characters of the
 *   search term must appear in order within the value.
 *
 * @param value      - The value to search in.
 * @param searchTerm - The term to look for.
 * @param options    - Optional search configuration.
 * @returns `true` when the value matches the search term.
 *
 * @example
 * ```ts
 * textMatch('Hello World', 'hello');                        // true  (case-insensitive)
 * textMatch('Hello World', 'hello', { caseSensitive: true }); // false
 * textMatch(42, '4');                                       // true  (number → "42")
 * textMatch('Hello World', 'hwd', { fuzzy: true });         // true  (subsequence)
 * textMatch(null, 'x');                                     // false
 * textMatch('anything', '  ');                              // true  (empty after trim)
 * ```
 */
export const textMatch = (
  value: Searchable,
  searchTerm: string,
  options: TextFilterOptions = {},
): boolean => {
  const { caseSensitive = false, trim = true, fuzzy = false } = options;

  let text = toSearchableString(value);

  if (trim) {
    searchTerm = searchTerm.trim();
  }

  if (!searchTerm) {
    return true;
  }

  if (!text) {
    return false;
  }

  if (!caseSensitive) {
    text = text.toLowerCase();
    searchTerm = searchTerm.toLowerCase();
  }

  return fuzzy ? subsequenceMatch(text, searchTerm) : text.includes(searchTerm);
};

/**
 * Filters an array of items by matching a search term against a text field
 * extracted via `accessor`. Returns the **original array reference** when the
 * search term is empty so that `useMemo` consumers avoid unnecessary rerenders.
 */
export const filterByText = <T>(
  items: T[],
  searchTerm: string | undefined,
  accessor: (item: T) => string,
  options?: TextFilterOptions,
): T[] => {
  const { trim = true } = options ?? {};
  const term = searchTerm ?? '';
  const normalized = trim ? term.trim() : term;

  if (!normalized) {
    return items;
  }

  return items.filter((item) => textMatch(accessor(item), normalized, options));
};
