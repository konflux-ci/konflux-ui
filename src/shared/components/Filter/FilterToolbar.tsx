import * as React from 'react';
import { Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import { useFilterState } from '~/shared/components/Filter/hooks/useFilterState';
import type { FilterConfig, OptionItem } from '~/shared/components/Filter/types';
import { BooleanFilter } from './controls/BooleanFilter';
import { MultiSelectFilter } from './controls/MultiSelectFilter';
import { SearchFilter } from './controls/SearchFilter';
import { SingleSelectFilter } from './controls/SingleSelectFilter';
import { SwitchableSearchFilter } from './controls/SwitchableSearchFilter';

/** Configuration for a named toolbar group. */
export type ToolbarGroupConfig = {
  /** PF ToolbarGroup variant. Defaults to 'filter-group'. */
  variant?: 'filter-group' | 'action-group-plain' | 'action-group';
};

/**
 * Props for `FilterToolbar`.
 *
 * @typeParam C - Readonly tuple of filter configs.
 */
type FilterToolbarProps<C extends readonly FilterConfig<unknown>[]> = {
  /** Filter configuration array describing which controls to render. */
  configs: C;
  /** Dropdown options keyed by filter `param`. Required for `multiSelect` and `singleSelect`. */
  options?: Record<string, OptionItem[]>;
  /** Configuration for named toolbar groups. Keys are group names from filter configs. */
  groups?: Record<string, ToolbarGroupConfig>;
  /** Extra toolbar items rendered after the filter controls (e.g. action buttons). */
  children?: React.ReactNode;
};

/**
 * Renders the appropriate filter control component for a given config.
 * @internal
 */
const renderControl = (config: FilterConfig<unknown>, options: Record<string, OptionItem[]>) => {
  switch (config.type) {
    case 'search':
      return <SearchFilter key={config.param} config={config} />;
    case 'multiSelect': {
      const configOptions = options[config.param] ?? [];
      return (
        <MultiSelectFilter
          key={config.param}
          config={config}
          options={configOptions}
          isDisabled={configOptions.length === 0}
        />
      );
    }
    case 'singleSelect':
      return (
        <SingleSelectFilter
          key={config.param}
          config={config}
          options={options[config.param] ?? []}
        />
      );
    case 'boolean':
      return <BooleanFilter key={config.param} config={config} />;
    case 'switchableSearch':
      return <SwitchableSearchFilter key={config.param} config={config} />;
    default:
      return null;
  }
};

/**
 * Renders a PatternFly `Toolbar` with filter controls generated from a config array.
 *
 * Each config entry produces the matching control component (`SearchFilter`,
 * `MultiSelectFilter`, etc.). The toolbar's "Clear all filters" action resets
 * every URL parameter declared in the configs.
 *
 * @typeParam C - Readonly tuple of filter configs.
 *
 * @example
 * ```tsx
 * <FilterToolbar configs={filterConfigs} options={{ status: statusOptions }}>
 *   <Button>Create</Button>
 * </FilterToolbar>
 * ```
 */
export const FilterToolbar = <C extends readonly FilterConfig<unknown>[]>({
  configs,
  options = {},
  groups: groupConfigs = {},
  children,
}: FilterToolbarProps<C>) => {
  const { clearAll } = useFilterState(configs);

  // Group configs by group name, preserving order
  const groupedConfigs = React.useMemo(() => {
    const map = new Map<string | undefined, FilterConfig<unknown>[]>();
    for (const config of configs) {
      const key = config.group;
      const existing = map.get(key);
      if (existing) {
        existing.push(config);
      } else {
        map.set(key, [config]);
      }
    }
    return map;
  }, [configs]);

  return (
    <Toolbar data-test="filter-toolbar" clearAllFilters={clearAll}>
      <ToolbarContent>
        {Array.from(groupedConfigs.entries()).map(([groupName, groupConfigs_]) => {
          const variant = groupName
            ? (groupConfigs[groupName]?.variant ?? 'filter-group')
            : 'filter-group';
          return (
            <ToolbarGroup
              key={groupName ?? '__default'}
              variant={variant}
              data-test={groupName ? `filter-group-${groupName}` : 'filter-group-default'}
              alignSelf="center"
            >
              {groupConfigs_.map((config) => renderControl(config, options))}
            </ToolbarGroup>
          );
        })}
        {children ? <ToolbarItem>{children}</ToolbarItem> : null}
      </ToolbarContent>
    </Toolbar>
  );
};
