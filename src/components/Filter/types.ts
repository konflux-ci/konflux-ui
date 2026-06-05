// --- Filter modes ---
export type FilterMode = 'client' | 'api';

// --- Option types ---
export type FilterOption = { label: string; value: string };
export type DividerOption = { type: 'divider' };
export type OptionItem = FilterOption | DividerOption;

// --- Base config ---
export type FilterConfigBase = {
  param: string;
  label: string;
  mode?: FilterMode; // defaults to 'client'
};

// --- Search ---
export type SearchFilterConfig<T> = FilterConfigBase & {
  type: 'search';
  placeholder?: string;
  debounce?: number; // defaults to 600
  filterFn?: (item: T, value: string) => boolean;
};

// --- Multi-select ---
export type MultiSelectFilterConfig<T> = FilterConfigBase & {
  type: 'multiSelect';
  filterFn: (item: T, selectedValues: string[]) => boolean;
};

// --- Single-select ---
export type SingleSelectFilterConfig<T> = FilterConfigBase & {
  type: 'singleSelect';
  filterFn: (item: T, selectedValue: string) => boolean;
};

// --- Boolean ---
export type BooleanFilterConfig = FilterConfigBase & {
  type: 'boolean';
};

// --- Switchable search field ---
export type SwitchableSearchField<T> = {
  label: string;
  value: string;
  param: string;
  mode?: FilterMode;
  filterFn: (item: T, text: string) => boolean;
};

// --- Switchable search ---
export type SwitchableSearchFilterConfig<T> = FilterConfigBase & {
  type: 'switchableSearch';
  fields: SwitchableSearchField<T>[];
  debounce?: number;
};

// --- Union ---
export type FilterConfig<T> =
  | SearchFilterConfig<T>
  | MultiSelectFilterConfig<T>
  | SingleSelectFilterConfig<T>
  | BooleanFilterConfig
  | SwitchableSearchFilterConfig<T>;

// --- Filter value type mapping ---
export type FilterValueType = {
  search: string;
  switchableSearch: string;
  multiSelect: string[];
  singleSelect: string;
  boolean: boolean;
};

// --- Helper types for FilterValues inference ---
type ParamOf<C> = C extends { param: infer P extends string } ? P : never;
type TypeOf<C> = C extends { type: infer T extends keyof FilterValueType }
  ? FilterValueType[T]
  : never;

type SwitchableFieldParams<C> =
  C extends SwitchableSearchFilterConfig<unknown> ? C['fields'][number]['param'] : never;

// --- FilterValues mapped type ---
export type FilterValues<C extends readonly FilterConfig<unknown>[]> = {
  [K in C[number] as ParamOf<K>]: TypeOf<K>;
} & {
  [K in C[number] as SwitchableFieldParams<K>]: string;
};

// --- ClientFilterValues: excludes mode:'api' and type:'boolean' ---
type IsClientFilter<C> = C extends { type: 'boolean' }
  ? false
  : C extends { mode: 'api' }
    ? false
    : true;

type ClientFilterConfig<C> =
  C extends FilterConfig<unknown> ? (IsClientFilter<C> extends true ? C : never) : never;

export type ClientFilterValues<C extends readonly FilterConfig<unknown>[]> = {
  [K in ClientFilterConfig<C[number]> as ParamOf<K>]: TypeOf<K>;
};

// --- defineFilters helper ---
export const defineFilters =
  <T>() =>
  <const C extends readonly FilterConfig<T>[]>(configs: C): C =>
    configs;
