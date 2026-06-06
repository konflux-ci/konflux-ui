import * as React from 'react';
import { Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import { useFilterState } from '~/shared/components/Filter/hooks/useFilterState';
import type { FilterConfig, OptionItem } from '~/shared/components/Filter/types';
import { BooleanFilter } from './controls/BooleanFilter';
import { MultiSelectFilter } from './controls/MultiSelectFilter';
import { SearchFilter } from './controls/SearchFilter';
import { SingleSelectFilter } from './controls/SingleSelectFilter';
import { SwitchableSearchFilter } from './controls/SwitchableSearchFilter';

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
    case 'multiSelect':
      return (
        <MultiSelectFilter
          key={config.param}
          config={config}
          options={options[config.param] ?? []}
        />
      );
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
  children,
}: FilterToolbarProps<C>) => {
  const { clearAll } = useFilterState(configs);

  return (
    <Toolbar data-test="filter-toolbar" clearAllFilters={clearAll}>
      <ToolbarContent>
        <ToolbarGroup variant="filter-group">
          {configs.map((config) => renderControl(config, options))}
        </ToolbarGroup>
        {children ? <ToolbarItem>{children}</ToolbarItem> : null}
      </ToolbarContent>
    </Toolbar>
  );
};
