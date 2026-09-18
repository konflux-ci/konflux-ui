/**
 * Generic, config-driven status registry factory.
 *
 * Resource-agnostic — works with any string union and resource type.
 */

import type { LabelProps } from '@patternfly/react-core';
import { t_chart_color_green_100 as successColor } from '@patternfly/react-tokens/dist/js/t_chart_color_green_100';
import { t_global_color_brand_100 as infoColor } from '@patternfly/react-tokens/dist/js/t_global_color_brand_100';
import { t_global_color_severity_undefined_100 as neutralColor } from '@patternfly/react-tokens/dist/js/t_global_color_severity_undefined_100';
import { t_global_color_status_warning_100 as warningColor } from '@patternfly/react-tokens/dist/js/t_global_color_status_warning_100';
import { t_global_icon_color_status_danger_default as dangerColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_danger_default';
import { RunStatus } from '@patternfly/react-topology';

export type StatusCategory = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

type ColorEntry = { hex: string; name: NonNullable<LabelProps['color']> };

export const CATEGORY_COLORS: Record<StatusCategory, ColorEntry> = {
  success: { hex: successColor.value, name: 'green' },
  danger: { hex: dangerColor.value, name: 'red' },
  warning: { hex: warningColor.value, name: 'yellow' },
  info: { hex: infoColor.value, name: 'blue' },
  neutral: { hex: neutralColor.value, name: 'grey' },
};

export const CATEGORY_PF_RUN_STATUS: Record<StatusCategory, RunStatus> = {
  success: RunStatus.Succeeded,
  danger: RunStatus.Failed,
  warning: RunStatus.Cancelled,
  info: RunStatus.Running,
  neutral: RunStatus.Pending,
};

export type StatusEntryConfig<TStatus extends string, TResource, TContext = void> = {
  status: TStatus;
  /**
   * Predicate evaluated in array order by deriveStatus() — first match wins.
   * Do NOT use match predicates directly for filtering; use createFilterFn().
   */
  match: (obj: TResource, context: TContext) => boolean;
  category: StatusCategory;
  /** Sort weight for display ordering (lower = more prominent). Separate from evaluation order. */
  weight: number;
  label?: string;
  pfRunStatus?: RunStatus;
  color?: ColorEntry;
  tags?: string[];
};

export type StatusRegistryInput<TStatus extends string, TResource, TContext = void> = {
  createContext?: (obj: TResource) => TContext;
  /** Array position = predicate evaluation order. Weight = display sort order. */
  statuses: ReadonlyArray<StatusEntryConfig<TStatus, TResource, TContext>>;
};

export type StatusConfigDisplay<TStatus extends string> = {
  status: TStatus;
  label: string;
  color: string;
  colorName: NonNullable<LabelProps['color']>;
  runStatus: RunStatus;
  category: StatusCategory;
};

export type StatusRegistry<TStatus extends string, TResource, TContext = void> = ReturnType<
  ReturnType<typeof createStatusRegistry<TStatus, TResource, TContext>>
>;

/**
 * Creates a typed status registry from an ordered config array.
 * Curried form enables TypeScript to infer config literal types.
 */
export function createStatusRegistry<TStatus extends string, TResource, TContext = void>() {
  return (input: StatusRegistryInput<TStatus, TResource, TContext>) => {
    const { createContext, statuses } = input;

    const entryRecord = {} as Record<TStatus, StatusEntryConfig<TStatus, TResource, TContext>>;
    const tagSets = new Map<TStatus, Set<string>>();
    for (const entry of statuses) {
      entryRecord[entry.status] = entry;
      if (entry.tags?.length) {
        tagSets.set(entry.status, new Set(entry.tags));
      }
    }

    const byWeight = [...statuses].sort((a, b) => a.weight - b.weight);

    const getEntryColor = (status: TStatus): ColorEntry => {
      const entry = entryRecord[status];
      return entry.color ?? CATEGORY_COLORS[entry.category];
    };

    const registry = {
      deriveStatus(obj: TResource): TStatus {
        const ctx = createContext ? createContext(obj) : (undefined as TContext);
        for (const entry of statuses) {
          if (entry.match(obj, ctx)) return entry.status;
        }
        return statuses[statuses.length - 1].status;
      },

      getEntry: (status: TStatus) => entryRecord[status],
      getLabel: (status: TStatus) => entryRecord[status].label ?? String(status),
      getCategory: (status: TStatus) => entryRecord[status].category,
      getWeight: (status: TStatus) => entryRecord[status].weight,
      getColor: (status: TStatus) => getEntryColor(status).hex,
      getColorName: (status: TStatus) => getEntryColor(status).name,
      getRunStatus: (status: TStatus) => {
        const entry = entryRecord[status];
        return entry.pfRunStatus ?? CATEGORY_PF_RUN_STATUS[entry.category];
      },
      hasTag: (status: TStatus, tag: string) => tagSets.get(status)?.has(tag) ?? false,

      allStatuses: byWeight.map((e) => e.status),

      getStatusesByTag: (tag: string): TStatus[] =>
        byWeight.filter((e) => e.tags?.includes(tag)).map((e) => e.status),

      weightMap: Object.fromEntries(statuses.map((e) => [e.status, e.weight])) as Record<
        TStatus,
        number
      >,

      getStatusConfigs(exclude?: ReadonlySet<TStatus>): StatusConfigDisplay<TStatus>[] {
        return byWeight
          .filter((e) => !exclude?.has(e.status))
          .map((e) => ({
            status: e.status,
            label: e.label ?? String(e.status),
            color: getEntryColor(e.status).hex,
            colorName: getEntryColor(e.status).name,
            runStatus: e.pfRunStatus ?? CATEGORY_PF_RUN_STATUS[e.category],
            category: e.category,
          }));
      },

      /**
       * Creates a filter predicate using deriveStatus() internally.
       * Do NOT filter with individual match predicates — they are order-dependent.
       */
      createFilterFn(selectedStatuses: TStatus[]): (obj: TResource) => boolean {
        const selected = new Set(selectedStatuses);
        return (obj: TResource) => selected.has(registry.deriveStatus(obj));
      },

      createContext,
      config: input,
    };

    return registry;
  };
}
