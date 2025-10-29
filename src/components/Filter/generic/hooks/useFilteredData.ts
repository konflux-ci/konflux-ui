import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { COMMIT_ANNOTATION_KEYS, COMMIT_LABEL_KEYS } from '../../../../consts/pipeline';
import { FilterConfig, FilterValues, UseFilteredDataResult, FilterOption } from '../FilterConfig';

// Helper function to get nested property value using dot notation
const getNestedValue = (obj: unknown, path: string): unknown => {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
};

// Helper function to get current filter value from URL params
const getFilterValue = (searchParams: URLSearchParams, param: string, type: string): unknown => {
  const value = searchParams.get(param);
  if (!value) {
    return type === 'multiSelect' ? [] : '';
  }

  if (type === 'multiSelect') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }

  return value;
};

// Helper function to get search attribute values from URL params
const getSearchAttributeValues = (
  searchParams: URLSearchParams,
  config: FilterConfig,
): Record<string, string> => {
  if (!config.searchAttributes) {
    return {};
  }

  const values: Record<string, string> = {};
  config.searchAttributes.attributes.forEach((attr) => {
    const value = searchParams.get(attr.key);
    if (value) {
      values[attr.key] = value;
    }
  });
  return values;
};

// Helper function to apply client-side filtering
const applyClientFiltering = <T>(
  data: T[],
  filterConfigs: FilterConfig[],
  filterValues: FilterValues,
): T[] => {
  return data.filter((item) => {
    return filterConfigs.every((config) => {
      if (config.mode === 'api') {
        return true; // Skip API-mode filters for client filtering
      }

      const filterValue = filterValues[config.param];

      // Skip empty filters
      if (
        !filterValue ||
        (Array.isArray(filterValue) && filterValue.length === 0) ||
        (typeof filterValue === 'string' && filterValue.trim() === '') ||
        (typeof filterValue === 'object' &&
          filterValue !== null &&
          Object.keys(filterValue).length === 0)
      ) {
        return true;
      }

      // Use custom filter function if provided
      if (config.filterFn) {
        return config.filterFn(item, filterValue);
      }

      // Default filtering logic based on type
      switch (config.type) {
        case 'search': {
          // Handle searchAttributes case
          if (config.searchAttributes && typeof filterValue === 'object' && filterValue !== null) {
            const searchValues = filterValue as Record<string, string>;
            return Object.entries(searchValues).every(([attributeKey, searchTerm]) => {
              if (!searchTerm || !searchTerm.trim()) {
                return true;
              }

              const trimmedTerm = searchTerm.trim().toLowerCase();

              // Default search logic based on attribute key
              switch (attributeKey) {
                case 'name': {
                  // Search in common name fields
                  const itemObj = item as Record<string, unknown>;
                  const metadata = itemObj.metadata as Record<string, unknown>;
                  const labels = metadata?.labels as Record<string, unknown>;

                  const name = metadata?.name as string;
                  const componentName = labels?.component as string;

                  return (
                    (name && name.toLowerCase().includes(trimmedTerm)) ||
                    (componentName && componentName.toLowerCase().includes(trimmedTerm))
                  );
                }

                case 'commit': {
                  // Search in commit-related fields using prefix matching
                  const itemObj = item as Record<string, unknown>;
                  const metadata = itemObj.metadata as Record<string, unknown>;
                  const labels = metadata?.labels as Record<string, unknown>;
                  const annotations = metadata?.annotations as Record<string, unknown>;

                  // Common commit label/annotation keys
                  const commitFields = [
                    ...COMMIT_LABEL_KEYS.map((key) => labels?.[key] as string),
                    ...COMMIT_ANNOTATION_KEYS.map((key) => annotations?.[key] as string),
                  ];

                  return commitFields.some(
                    (commitSha) => commitSha && commitSha.toLowerCase().startsWith(trimmedTerm),
                  );
                }

                default: {
                  // Generic search: try to find the attribute as a nested property
                  const value = getNestedValue(item, attributeKey);
                  if (value && typeof value === 'string') {
                    return value.toLowerCase().includes(trimmedTerm);
                  }

                  // Fallback: search in specific fields only
                  const searchableFields = ['name', 'description', 'status'];
                  return searchableFields.some((field) => {
                    const fieldValue = getNestedValue(item, field);
                    return fieldValue && String(fieldValue).toLowerCase().includes(trimmedTerm);
                  });
                }
              }
            });
          } else if (typeof filterValue === 'string') {
            // Handle simple search case
            const searchTerm = filterValue.toLowerCase().trim();
            if (!searchTerm) return true;

            // Default search: look for the value in common searchable fields
            const itemStr = JSON.stringify(item).toLowerCase();
            return itemStr.includes(searchTerm);
          }
          return true;
        }

        case 'multiSelect': {
          if (!Array.isArray(filterValue) || filterValue.length === 0) return true;

          if (config.filterFn) {
            return config.filterFn(item, filterValue);
          }

          // Default: return true if no filtering logic is provided
          return true;
        }

        case 'singleSelect': {
          // TODO: Implement single select filtering
          return true;
        }

        case 'dateRange': {
          // TODO: Implement date range filtering
          return true;
        }

        case 'boolean': {
          // TODO: Implement boolean filtering
          return true;
        }

        default:
          return true;
      }
    });
  });
};

export const useFilteredData = <T = unknown>(
  data: T[],
  filterConfigs: FilterConfig[],
): UseFilteredDataResult<T> => {
  const [searchParams] = useSearchParams();

  // Extract current filter values from URL
  const filterValues = useMemo(() => {
    const values: FilterValues = {};
    filterConfigs.forEach((config) => {
      if (config.type === 'search' && config.searchAttributes) {
        // For search with attributes, get values for all attributes
        values[config.param] = getSearchAttributeValues(searchParams, config);
      } else {
        // For regular filters, get the single value
        values[config.param] = getFilterValue(searchParams, config.param, config.type);
      }
    });
    return values;
  }, [searchParams, filterConfigs]);

  // Check if any filters are active
  const isFiltered = useMemo(() => {
    return Object.values(filterValues).some((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value as Record<string, unknown>).some(
          (v) => v !== '' && v !== null && v !== undefined,
        );
      }
      return value !== '' && value !== null && value !== undefined;
    });
  }, [filterValues]);

  // Apply client-side filtering
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    return applyClientFiltering(data, filterConfigs, filterValues);
  }, [data, filterConfigs, filterValues]);

  return {
    filteredData,
    filterValues,
    isFiltered,
  };
};

// Helper hook to get options for a specific filter
export const useFilterOptions = <T = unknown>(data: T[], config: FilterConfig): FilterOption[] => {
  return useMemo(() => {
    if (config.getOptions) {
      return config.getOptions(data);
    }

    return [];
  }, [data, config]);
};
