import { FilterOption, OptionItem } from '~/shared/components/Filter/types';

/**
 * Sentinel value used to represent items whose key extractor returns
 * `null` or `undefined`. Use this in `filterFn` to match "no value" items.
 */
export const NONE_VALUE = '__none__';

type BuildOptionsConfig = {
  /** Restrict output to only these key values. */
  validKeys?: string[];
  /** Custom formatter for option labels. Defaults to capitalizing the first letter. */
  labelFormatter?: (value: string) => string;
};

const defaultLabelFormatter = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

/**
 * Extracts unique option values from a data array.
 *
 * Iterates `data`, calls `keyExtractor` on each item, deduplicates the results,
 * and returns sorted `FilterOption[]` objects. Nullish keys are skipped.
 *
 * @typeParam T - The data-item type.
 * @param data - Source data array.
 * @param keyExtractor - Function that extracts the option value from an item.
 * @param opts - Optional configuration for restricting keys and formatting labels.
 * @returns Sorted array of unique `FilterOption` objects.
 *
 * @example
 * ```ts
 * const statusOptions = buildOptions(pipelineRuns, (r) => r.status);
 * ```
 */
export const buildOptions = <T>(
  data: T[],
  keyExtractor: (item: T) => string | undefined | null,
  opts?: BuildOptionsConfig,
): FilterOption[] => {
  const formatter = opts?.labelFormatter ?? defaultLabelFormatter;
  const validSet = opts?.validKeys ? new Set(opts.validKeys) : undefined;

  const unique = new Set<string>();
  for (const item of data) {
    const key = keyExtractor(item);
    if (key == null) continue;
    if (validSet && !validSet.has(key)) continue;
    unique.add(key);
  }

  return [...unique]
    .map((value) => ({ label: formatter(value), value }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

/**
 * Like {@link buildOptions} but appends a synthetic "none" option (with
 * {@link NONE_VALUE}) when any item's key is `null` or `undefined`.
 *
 * A visual divider is inserted between the regular options and the fallback.
 *
 * @typeParam T - The data-item type.
 * @param data - Source data array.
 * @param keyExtractor - Function that extracts the option value from an item.
 * @param undefinedLabel - Display label for the synthetic "none" option (e.g. "No status").
 * @returns Array of `OptionItem` (options + optional divider + fallback).
 */
export const buildOptionsWithFallback = <T>(
  data: T[],
  keyExtractor: (item: T) => string | undefined | null,
  undefinedLabel: string,
): OptionItem[] => {
  if (data.length === 0) return [];

  const options = buildOptions(data, keyExtractor);
  const hasUndefined = data.some((item) => keyExtractor(item) == null);

  if (!hasUndefined) return options;

  const result: OptionItem[] = [...options];
  if (options.length > 0) {
    result.push({ type: 'divider' });
  }
  result.push({ label: undefinedLabel, value: NONE_VALUE });
  return result;
};
