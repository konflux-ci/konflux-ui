export type FilterType = 'search' | 'singleSelect' | 'multiSelect' | 'dateRange' | 'boolean';

export type FilterMode = 'api' | 'client';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

// Simple attribute option for search
export interface AttributeOption {
  key: string;
  label: string;
}

export interface FilterConfig {
  // Basic configuration
  type: FilterType;
  param: string; // URL parameter name
  mode: FilterMode;
  label?: string; // Display label for the filter
  placeholder?: string; // Placeholder text for input filters

  // Options configuration

  // Function to dynamically generate filter options from data
  // Use this for multiSelect and singleSelect filters to provide real-time options with counts
  // Example: getOptions: (data) => data.map(item => ({ value: item.status, label: item.status, count: 1 }))
  getOptions?: (data: unknown[]) => FilterOption[];

  // Search attributes configuration (for search type filters only)
  searchAttributes?: {
    attributes: AttributeOption[];
    defaultAttribute?: string;
    getPlaceholder?: (attribute: string) => string;
  };

  // Additional configuration
  isSearchable?: boolean; // For select types

  // Validation and formatting for selected value
  validate?: (value: unknown) => boolean;
  format?: (value: unknown) => string;

  // Custom filter function for client-side filtering (required for multiSelect/singleSelect)
  // Use this to define how items are filtered based on selected filter values
  // Example: filterFn: (item, selectedValues) => selectedValues.includes(item.status)
  filterFn?: (item: unknown, value: unknown) => boolean;

  // API-specific configuration
  apiConfig?: {
    queryParam?: string; // Different param name for API calls
    transformer?: (value: unknown) => unknown; // Transform value for API
  };
}

export interface FilterValues {
  [param: string]: unknown;
}

export interface UseFilteredDataResult<T = unknown> {
  filteredData: T[];
  filterValues: FilterValues;
  isFiltered: boolean;
}
