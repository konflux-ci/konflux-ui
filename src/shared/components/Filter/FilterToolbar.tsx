import * as React from 'react';
import { Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import { useFilterState } from '~/shared/components/Filter/hooks/useFilterState';
import type { FilterConfig, OptionItem } from '~/shared/components/Filter/types';
import { BooleanFilter } from './controls/BooleanFilter';
import { MultiSelectFilter } from './controls/MultiSelectFilter';
import { SearchFilter } from './controls/SearchFilter';
import { SingleSelectFilter } from './controls/SingleSelectFilter';
import { SwitchableSearchFilter } from './controls/SwitchableSearchFilter';

type FilterToolbarProps<C extends readonly FilterConfig<unknown>[]> = {
  configs: C;
  options?: Record<string, OptionItem[]>;
  children?: React.ReactNode;
};

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
