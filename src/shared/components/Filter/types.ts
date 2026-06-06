/**
 * Controls where filtering is applied.
 *
 * - `'client'` — filtering happens in the browser against local data.
 * - `'api'` — the filter value is sent to an API; the hook does not filter locally.
 */
export type FilterMode = 'client' | 'api';

/** A selectable option shown in a dropdown filter control. */
export type FilterOption = { label: string; value: string };

/** A visual divider inserted between groups of options in a dropdown. */
export type DividerOption = { type: 'divider' };

/** Discriminated union of items that can appear in a filter dropdown. */
export type OptionItem = FilterOption | DividerOption;

/**
 * Shared fields present on every filter configuration.
 *
 * @property param - URL search-parameter name used by nuqs.
 * @property label - Human-readable label shown in the toolbar control.
 * @property mode  - Where filtering runs. Defaults to `'client'` when omitted.
 */
export type FilterConfigBase = {
  param: string;
  label: string;
  mode?: FilterMode; // defaults to 'client'
};

/**
 * Configuration for a text-search filter.
 *
 * Renders a `SearchInput` with debounced URL updates.
 *
 * @typeParam T - The data-item type being filtered.
 *
 * @property placeholder - Placeholder text for the search input.
 * @property debounce    - Debounce delay in milliseconds. Defaults to `600`.
 * @property filterFn    - Custom predicate. When omitted, falls back to `textMatch` on
 *                         `item.metadata.name`.
 */
export type SearchFilterConfig<T> = FilterConfigBase & {
  type: 'search';
  placeholder?: string;
  debounce?: number; // defaults to 600
  filterFn?: (item: T, value: string) => boolean;
};

/**
 * Configuration for a multi-select checkbox filter.
 *
 * Renders a dropdown with checkboxes; selected values are stored as a JSON
 * array in the URL.
 *
 * @typeParam T - The data-item type being filtered.
 *
 * @property filterFn - Predicate that receives the item and the array of selected values.
 */
export type MultiSelectFilterConfig<T> = FilterConfigBase & {
  type: 'multiSelect';
  filterFn: (item: T, selectedValues: string[]) => boolean;
};

/**
 * Configuration for a single-select dropdown filter.
 *
 * Only one value can be active at a time; clicking the same value deselects it.
 *
 * @typeParam T - The data-item type being filtered.
 *
 * @property filterFn - Predicate that receives the item and the selected value.
 */
export type SingleSelectFilterConfig<T> = FilterConfigBase & {
  type: 'singleSelect';
  filterFn: (item: T, selectedValue: string) => boolean;
};

/**
 * Configuration for a boolean toggle-switch filter.
 *
 * Renders a `Switch` control. Boolean filters are intentionally excluded from
 * `ClientFilterValues` because they do not participate in client-side data filtering
 * — they are consumed directly by components or API calls.
 */
export type BooleanFilterConfig = FilterConfigBase & {
  type: 'boolean';
};

/**
 * Describes a single field option within a switchable-search filter.
 *
 * Each field has its own URL parameter so multiple search terms can coexist.
 *
 * @typeParam T - The data-item type being filtered.
 *
 * @property label    - Display label in the field-picker dropdown.
 * @property value    - Unique identifier for this field (used as dropdown value).
 * @property param    - URL search-parameter name for this field's text value.
 * @property mode     - Override filter mode per field. Defaults to `'client'`.
 * @property filterFn - Predicate that receives the item and the search text.
 */
export type SwitchableSearchField<T> = {
  label: string;
  value: string;
  param: string;
  mode?: FilterMode;
  filterFn: (item: T, text: string) => boolean;
};

/**
 * Configuration for a search input with a field-picker dropdown.
 *
 * Combines a dropdown (to select which field to search) with a text input.
 * Each field has its own URL parameter, allowing independent search values.
 *
 * @typeParam T - The data-item type being filtered.
 *
 * @property fields   - Array of field definitions for the field-picker dropdown.
 * @property debounce - Debounce delay in milliseconds. Defaults to `600`.
 */
export type SwitchableSearchFilterConfig<T> = FilterConfigBase & {
  type: 'switchableSearch';
  fields: SwitchableSearchField<T>[];
  debounce?: number;
};

/**
 * Discriminated union of all supported filter configuration types.
 *
 * Pass an array of these to `useFilterState`, `useFilteredData`, and `FilterToolbar`.
 *
 * @typeParam T - The data-item type being filtered.
 */
export type FilterConfig<T> =
  | SearchFilterConfig<T>
  | MultiSelectFilterConfig<T>
  | SingleSelectFilterConfig<T>
  | BooleanFilterConfig
  | SwitchableSearchFilterConfig<T>;

/**
 * Maps each filter type discriminant to its URL-parameter value type.
 *
 * Used internally by `FilterValues` and `ClientFilterValues` to infer the
 * correct value type for each filter's `param`.
 */
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

/**
 * Mapped type that infers a record of `{ [param]: valueType }` for every
 * filter in a config tuple.
 *
 * For `switchableSearch` configs, the individual field `param` keys are also
 * included (each typed as `string`).
 *
 * @typeParam C - A readonly tuple of `FilterConfig` items, typically created
 *               via `defineFilters`.
 */
export type FilterValues<C extends readonly FilterConfig<unknown>[]> = {
  [K in C[number] as ParamOf<K>]: TypeOf<K>;
} & {
  [K in C[number] as SwitchableFieldParams<K>]: string;
};

/**
 * Like {@link FilterValues} but excludes filters with `mode: 'api'` and
 * `type: 'boolean'`.
 *
 * This represents the subset of filter values that `useFilteredData` uses
 * for client-side filtering.
 *
 * @typeParam C - A readonly tuple of `FilterConfig` items.
 */
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

/**
 * Curried helper that provides type inference for filter config arrays.
 *
 * The outer call binds the data-item type `T`; the inner call accepts
 * the config array with `as const` for full literal-type inference.
 *
 * @typeParam T - The data-item type being filtered.
 * @returns A function that accepts a readonly config array and returns it unchanged.
 *
 * @example
 * ```ts
 * const filters = defineFilters<PipelineRun>()([
 *   { type: 'search', param: 'name', label: 'Name' },
 *   { type: 'multiSelect', param: 'status', label: 'Status', filterFn: matchStatus },
 * ] as const);
 * ```
 */
export const defineFilters =
  <T>() =>
  <const C extends readonly FilterConfig<T>[]>(configs: C): C =>
    configs;
