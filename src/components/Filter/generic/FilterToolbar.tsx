import React, { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarToggleGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons/dist/esm/icons/filter-icon';
import { FilterConfig } from './FilterConfig';
import { useFilterOptions } from './hooks/useFilteredData';
import { MultiSelect } from './MultiSelect';
import { SearchFilter } from './Search';

interface FilterToolbarProps {
  filterConfigs: FilterConfig[];
  data?: unknown[];
  dataTestId?: string;
}

const MultiSelectFilterComponent: React.FC<{
  config: FilterConfig;
  data: unknown[];
}> = ({ config, data }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const options = useFilterOptions<unknown>(data, config);

  const currentValues = useMemo(() => {
    const param = searchParams.get(config.param);
    if (!param) return [];
    try {
      const parsed = JSON.parse(param);
      return Array.isArray(parsed) && parsed.every((v) => typeof v === 'string') ? parsed : [];
    } catch {
      return [];
    }
  }, [searchParams, config.param]);

  const selectOptions = useMemo(() => {
    return options.reduce(
      (acc, option) => {
        acc[option.value] = option.count || 0;
        return acc;
      },
      {} as { [key: string]: number },
    );
  }, [options]);

  const valueLabels = useMemo(() => {
    return options.reduce(
      (acc, option) => {
        acc[option.value] = option.label;
        return acc;
      },
      {} as { [key: string]: string },
    );
  }, [options]);

  const handleValuesChange = useCallback(
    (newValues: string[]) => {
      const newParams = new URLSearchParams(searchParams);
      if (newValues.length > 0) {
        newParams.set(config.param, JSON.stringify(newValues));
      } else {
        newParams.delete(config.param);
      }
      setSearchParams(newParams);
    },
    [config.param, searchParams, setSearchParams],
  );

  return (
    <ToolbarItem>
      <MultiSelect
        label={config.label || config.param}
        filterKey={config.param}
        values={currentValues}
        setValues={handleValuesChange}
        options={selectOptions}
        valueLabels={valueLabels}
      />
    </ToolbarItem>
  );
};

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filterConfigs,
  data = [],
  dataTestId = 'filter-toolbar',
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle clearing all filters
  const handleClearAllFilters = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    filterConfigs.forEach((config) => {
      if (config.type === 'search' && config.searchAttributes) {
        // Clear all search attribute parameters
        config.searchAttributes.attributes.forEach((attr) => {
          newParams.delete(attr.key);
        });
      } else {
        newParams.delete(config.param);
      }
    });
    setSearchParams(newParams);
  }, [filterConfigs, searchParams, setSearchParams]);

  // Render individual filter component based on type
  const renderFilter = (config: FilterConfig, index: number) => {
    const key = `${config.type}-${config.param}-${index}`;

    switch (config.type) {
      case 'search':
        return (
          <SearchFilter key={key} config={config} dataTestId={`${dataTestId}-${config.param}`} />
        );

      case 'multiSelect':
        return <MultiSelectFilterComponent key={key} config={config} data={data} />;

      case 'singleSelect':
        // TODO: Implement SingleSelectFilter when needed
        return null;
      case 'dateRange':
        // TODO: Implement DateRangeFilter when needed
        return null;
      case 'boolean':
        // TODO: Implement BooleanFilter when needed
        return null;

      default:
        return null;
    }
  };

  return (
    <Toolbar
      id={`${dataTestId}-toolbar`}
      clearAllFilters={handleClearAllFilters}
      data-testid={dataTestId}
    >
      <ToolbarContent>
        <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
          <ToolbarGroup variant="filter-group">{filterConfigs.map(renderFilter)}</ToolbarGroup>
        </ToolbarToggleGroup>
      </ToolbarContent>
    </Toolbar>
  );
};
