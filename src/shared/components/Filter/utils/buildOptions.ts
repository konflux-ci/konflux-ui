import { FilterOption, OptionItem } from '~/shared/components/Filter/types';

export const NONE_VALUE = '__none__';

type BuildOptionsConfig = {
  validKeys?: string[];
  labelFormatter?: (value: string) => string;
};

const defaultLabelFormatter = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

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
