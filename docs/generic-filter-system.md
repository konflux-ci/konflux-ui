# Generic Filter System Proposal [Not Implemented]

## Overview

I propose implementing a Generic Filter System that would provide a configuration-driven approach to filtering data in list views. This system would eliminate the need for custom filter implementations and provide a consistent, reusable solution across all list components.

**Proposed Components:**
1. **FilterToolbar Component**: Would render filter controls based on configuration
2. **useFilteredData Hook**: Would manage data filtering logic
3. **Filter Configuration Objects**: Would define filter behavior and options
4. **URL State Management**: Would provide automatic synchronization with browser URL

## Proposed Architecture

The proposed system would use a layered architecture where individual filter components would manage their own URL state:

```
FilterConfig => FilterToolbar => FilterWrapper => DumbComponent(SingleSelect/MultiSelect)
                       |              |              |
                  Renders      Manages URL    Handles UI
                 components     state via     interactions
                              useSearchParams
                                   |
                            URL Parameters <= => Browser URL
```

**Key Principles:**
- **Decentralized State**: Each filter would manage its own URL parameter
- **Configuration-Driven**: Filters would be defined through declarative configuration
- **URL as Single Source of Truth**: All filter state would be persisted in URL parameters
- **Layered Components**: Clean separation between UI, state, and data processing

### FilterConfig

```typescript
export type FilterType = 'search' | 'singleSelect' | 'multiSelect' | 'dateRange' | 'boolean';

export type FilterMode = 'api' | 'client';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterConfig {
  // Basic configuration
  type: FilterType;
  param: string; // URL parameter name
  mode: FilterMode;
  label?: string; // Display label for the filter
  placeholder?: string; // Placeholder text for input filters
  
  // Options configuration - use only ONE of these approaches
  
  // 1. Dynamic options from data source
  optionsSource?: {
    from: 'data';
    key: string; // Dot notation path to extract values (e.g., 'metadata.namespace', 'status', 'spec.type')
    labelFormatter?: (value: unknown) => string; // Transform raw values into display labels
    //[TODO]: sorting of filter options?
  };
  
  // 2. Function to dynamically generate options
  getOptions?: (data: unknown[]) => FilterOption[];
  
  // 3. Static predefined options
  options?: FilterOption[];
  
  // Additional configuration
  isSearchable?: boolean; // For select types
  
  // is validation and formatting for selected value?
  validate?: (value: unknown) => boolean;
  format?: (value: unknown) => string;
  
  // API-specific configuration [TODO]: is there a better way?
  apiConfig?: {
    queryParam?: string; // Different param name for API calls
    transformer?: (value: unknown) => unknown; // Transform value for API for example: {[PipelineRunLabel.label]: value}
  };
}
```

### Proposed FilterToolbar Component Rendering

The proposed FilterToolbar would automatically render the appropriate filter component based on the `type` field in each FilterConfig:

```
FilterConfig.type → Component Mapping:

┌─────────────────┬──────────────────────────┐
│ Filter Type     │ Rendered Component       │
├─────────────────┼──────────────────────────┤
│ 'search'        │ SearchFilter             │
│ 'singleSelect'  │ SingleSelectFilter       │
│ 'multiSelect'   │ MultiSelectFilter        │
└─────────────────┴──────────────────────────┘
```

### Proposed Rendering Flow

```typescript
// Proposed FilterToolbar implementation
const FilterToolbar = ({ filterConfigs }) => {
  return (
    <Toolbar>
      {filterConfigs.map(config => {
        switch (config.type) {
          case 'search':
            return <SearchFilter key={config.param} config={config} />;
          case 'singleSelect':
            return <SingleSelectFilter key={config.param} config={config} />;
          case 'multiSelect':
            return <MultiSelectFilter key={config.param} config={config} />;
          default:
            return null;
        }
      })}
    </Toolbar>
  );
};
```

### Proposed FilterWrapper Implementation

Each filter would be wrapped with a component that manages its URL state:

```typescript
// Example: MultiSelectFilter managing URL state
const MultiSelectFilter = ({ config }: { config: FilterConfig }) => {
  const [searchParams, setSearchParams] = useSearchParam(config.param);
  
  // Read current values from URL (JSON array)
  const currentValues = React.useMemo(() => {
    const param = searchParams
    if (!param) return [];
    try {
      return JSON.parse(param);
    } catch {
      return [];
    }
  }, [searchParams, config.param]);
  
  // Update URL when values change
  const handleValuesChange = (newValues: string[]) => {
    setSearchParams(newValues);
  };
  
  return (
    <MultiSelect
      {...props}
      options={options}
      values={currentValues}
      onChange={handleValuesChange}
    />
  );
};
```

## Migration Proposal

### Before: Current PipelineRunListView Implementation

```typescript
// Before - Current filter implementation pattern
const PipelineRunsListView = ({ applicationName, componentName, customFilter }) => {
  const namespace = useNamespace();
  
  // 1. FilterContext for URL state management
  const { filters: unparsedFilters, setFilters, onClearFilters } = React.useContext(FilterContext);
  
  // 2. Manual filter state parsing and typing
  const filters: PipelineRunsFilterState = useDeepCompareMemoize({
    name: unparsedFilters.name ? (unparsedFilters.name as string) : '',
    status: unparsedFilters.status ? (unparsedFilters.status as string[]) : [],
    type: unparsedFilters.type ? (unparsedFilters.type as string[]) : [],
  });
  
  const { name, status, type } = filters;

  // 3. Manual filter option generation
  const statusFilterObj = React.useMemo(
    () =>
      createFilterObj(sortedPipelineRuns, (plr) => pipelineRunStatus(plr), statuses, customFilter),
    [sortedPipelineRuns, customFilter],
  );

  const typeFilterObj = React.useMemo(
    () =>
      createFilterObj(
        sortedPipelineRuns,
        (plr) => plr?.metadata.labels[PipelineRunLabel.PIPELINE_TYPE],
        pipelineRunTypes,
        customFilter,
      ),
    [sortedPipelineRuns, customFilter],
  );

  // 4. Manual filtering logic
  const filteredPLRs = React.useMemo(
    () => filterPipelineRuns(sortedPipelineRuns, filters, customFilter, componentName),
    [sortedPipelineRuns, filters, customFilter, componentName],
  );

  // 5. Custom filter toolbar with manual props
  return (
    <>
      <PipelineRunsFilterToolbar
        filters={filters}
        setFilters={setFilters}
        onClearFilters={onClearFilters}
        typeOptions={typeFilterObj}
        statusOptions={statusFilterObj}
      />
      <Table data={filteredPLRs} /* ... other props */ />
    </>
  );
};
```
Supporting components and utilities needed:
 - FilterContext wrapping component in parent
 - PipelineRunsFilterToolbar component
 - createFilterObj utility function
 - filterPipelineRuns utility function
 - PipelineRunsFilterState type definition
 - Can't be used for other list views

### After: Proposed Generic Filter System

```typescript
const PipelineRunsListView = ({ applicationName, componentName, customFilter }) => {
  const namespace = useNamespace();
  
  // 1. Simple filter configuration
  const filterConfigs = [
    {
      type: 'search',
      param: 'name',
      label: 'Name',
      placeholder: 'Filter by name...',
      mode: 'client',
    },
    {
      type: 'multiSelect',
      param: 'status',
      label: 'Status',
      mode: 'client',
      optionsSource: {
        from: 'data',
        key: 'status',
        labelFormatter: (status) => pipelineRunStatus(status),
      },
    },
    {
      type: 'multiSelect',
      param: 'type',
      label: 'Type',
      mode: 'client',
      options: [
        { label: 'Build', value: 'build' },
        { label: 'Test', value: 'test' },
      ],
    },
  ];

  // 2. Automatic filtering and URL state management
  const { filteredData, isFiltered } = useFilteredData(sortedPipelineRuns, filterConfigs);

  // 3. Simple rendering
  return (
    <>
      <FilterToolbar filterConfigs={filterConfigs} />
      <Table data={filteredData} /* ... other props */ />
    </>
  );
};
```
   No additional components or utilities needed!
  - No FilterContext wrapper required
  - No custom filter toolbar component
  - No manual option generation utilities
  - No custom filter state types

## Proposed Usage Examples

### API-Mode Filtering

For server-side filtering, the proposed system would use `mode: 'api'`:

```typescript
const MyAPIListComponent = ({ data }) => {
  const filterConfigs = [
    {
      type: 'search',
      param: 'name',
      label: 'Name',
      mode: 'api',
    },
  ];

  // Hook only reads URL parameters, doesn't filter data
  const { filterValues, isFiltered } = useFilteredData(data, filterConfigs);
  
  // Use filterValues to make API calls
  const filteredData = useK8sWatchResource(Model, { matchLabel: createLabelsFromFilterValue(filterValues) });

  return (
    <>
      <FilterToolbar filterConfigs={filterConfigs} />
      <MyTable data={filteredData} />
    </>
  );
};
```

### Proposed Custom Filter Functions

```typescript
const MyClientListComponent = ({ data }) => {
  const filterConfigs = [
    {
      type: 'search',
      param: 'name',
      label: 'Name',
      mode: 'client',
      filterFn: (item, value) => item.name.toLowerCase().includes(value.toLowerCase()),
    },
  ];

  // Proposed hook API
  const { filteredData, isFiltered } = useFilteredData(data, filterConfigs);

  return (
    <>
      <FilterToolbar filterConfigs={filterConfigs} />
      <MyTable data={filteredData} />
    </>
  );
};
```

## Filter Configuration

### Options Configuration

You can configure filter options in three ways. Choose **one** approach per filter:

#### 1. Static Options (Known in Advance)

```typescript
{
  type: 'multiSelect',
  param: 'priority',
  label: 'Priority',
  mode: 'client',
  options: [
    { label: 'High Priority', value: 'high', count: 5 },
    { label: 'Medium Priority', value: 'medium', count: 12 },
    { label: 'Low Priority', value: 'low', count: 8 },
  ],
}
```

#### 2. Dynamic Options from Data (Simple Field Extraction)

```typescript
{
  type: 'multiSelect',
  param: 'tags',
  label: 'Tags',
  mode: 'client',
  optionsSource: {
    from: 'data',
    key: 'metadata.labels.tag',
    labelFormatter: (value) => `Tag: ${value}`,
  },
}
```

#### 3. Custom Options Function (Complex Logic) [TODO]: Do we need this?

```typescript
{
  type: 'multiSelect',
  param: 'author',
  label: 'Author',
  mode: 'client',
  getOptions: (data) => {
    const authors = data.map(item => item.author);
    const uniqueAuthors = [...new Set(authors)];
    return uniqueAuthors.map(author => ({
      value: author.id,
      label: author.name,
      count: authors.filter(a => a.id === author.id).length,
    }));
  },
}
```

### Filter Types

#### SearchFilter
```typescript
{
  type: 'search',
  param: 'name',
  label: 'Search',
  placeholder: 'Search items...',
  mode: 'client',
}
```

#### SingleSelectFilter
```typescript
{
  type: 'singleSelect',
  param: 'status',
  label: 'Status',
  mode: 'client',
  options: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ],
}
```

#### MultiSelectFilter
```typescript
{
  type: 'multiSelect',
  param: 'tags',
  label: 'Tags',
  mode: 'client',
  optionsSource: {
    from: 'data',
    key: 'metadata.labels.tag',
  },
}
```

### URL Parameter Format

The system automatically manages URL parameters:

```
# Search filters
?name=my-component

# Single select
?status=running

# Multi select (JSON encoded)
?tags=%5B%22frontend%22%2C%22backend%22%5D
```


## Proposed Configuration Utilities

I propose creating utility functions to reduce boilerplate and ensure consistency:

```typescript

/**
 * Create a single select filter configuration with sensible defaults
 */
export const createSingleSelectConfiguration = (
  param: string,
  options: {
    label?: string;
    placeholder?: string;
    mode?: FilterMode;
    options?: FilterOption[];
    optionsSource?: FilterConfig['optionsSource'];
  } = {}
): FilterConfig => ({
  type: 'singleSelect',
  param,
  label: options.label || param.charAt(0).toUpperCase() + param.slice(1),
  placeholder: options.placeholder || `Select ${param}...`,
  mode: options.mode || 'client',
  ...(options.options && { options: options.options }),
  ...(options.optionsSource && { optionsSource: options.optionsSource }),
});

export const createStatusFilterConfiguration = (args) =>
  createSingleSelectConfiguration('status', {
    label: 'Status',
    placeholder: 'Select Status...',
    mode: 'client',
    optionsSource: {
        from: 'data',
        key: 'status.phase',
        labelFormatter: (status) => getStatusDisplayName(status),
      },
  });
```

### Usage Example

```typescript
const ComponentsListView = ({ data }) => {
  const filterConfigs = [
    // Create a status filter using the utility
    createStatusFilterConfiguration(args),
  ];

  const { filteredData } = useFilteredData(data, filterConfigs);

  return (
    <>
      <FilterToolbar filterConfigs={filterConfigs} />
      <ComponentsTable data={filteredData} />
    </>
  );
};
```

## Components

### FilterToolbar

Main component that renders all filter controls:

```typescript
interface FilterToolbarProps {
  filterConfigs: FilterConfig[];
  isLoading?: boolean;
  dataTestId?: string;
}

<FilterToolbar 
  filterConfigs={filterConfigs}
  isLoading={isLoading}
  dataTestId="my-filters"
/>
```

### useFilteredData Hook

Core hook for managing filtered data with URL state:

```typescript
const { filteredData, isFiltered, filterValues } = useFilteredData(data, filterConfigs);
```



## Recommended Best Practices

### Performance

1. **Use API-mode for large datasets** to avoid client-side performance issues
2. **Minimize re-renders** by memoizing filter configurations
3. **Implement debouncing** for search filters to reduce API calls
4. **Cache filter options** when possible

## Proposed Implementation Plan

### Phase 1: Core Implementation

1. **Debounced Search**: Automatic debouncing for search filters
2. **Accessibility**: Enhanced keyboard navigation
3. **Basic Filter Types**: search, singleSelect, multiSelect

### Phase 2: Advanced Features
1. **Saved Filters**: User-defined filter presets (in a config map?)
2. **Advanced Filters**: Date ranges, number ranges, custom operators
3. **Filter Analytics**: Usage tracking and optimization

### Future Extension Points

1. **Custom Filter Types**: Add new filter control types as needed
2. **Custom Renderers**: Return react node for options instead of object config???
3. **Persistence**: Store filter preferences to local storage?
4. **Validation**: Add filter value validation for data integrity