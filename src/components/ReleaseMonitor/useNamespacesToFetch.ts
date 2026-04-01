import * as React from 'react';
import { FilterType } from '~/components/Filter/utils/filter-utils';
import { NamespaceKind } from '~/types';

interface UseNamespacesToFetchParams {
  loaded: boolean;
  namespaces: NamespaceKind[];
  unparsedFilters: FilterType;
  lastUsedNamespace: string;
  setFilters: (filters: FilterType) => void;
  selectedNamespaces: string[];
  threshold?: number;
}

const DEFAULT_THRESHOLD = 10;

/**
 * Custom hook to manage which namespaces should be fetched for release monitoring.
 * Handles initialization logic based on namespace count threshold and filter state.
 */
export const useNamespacesToFetch = ({
  loaded,
  namespaces,
  unparsedFilters,
  lastUsedNamespace,
  setFilters,
  selectedNamespaces,
  threshold = DEFAULT_THRESHOLD,
}: UseNamespacesToFetchParams) => {
  const [namespacesToFetch, setNamespacesToFetch] = React.useState<string[]>([]);
  const namespaceFilterInitializedRef = React.useRef<boolean>(false);

  // Initialize which namespaces to fetch based on threshold
  React.useEffect(() => {
    if (!loaded || namespaces.length === 0) return;

    if (namespaces.length <= threshold) {
      // Keep current behavior: fetch all namespaces
      setNamespacesToFetch(namespaces.map((n) => n.metadata.name));
      namespaceFilterInitializedRef.current = true;
    } else if (!namespaceFilterInitializedRef.current) {
      // Check for preselected namespaces from unparsedFilters
      const preselectedNamespacesRaw = unparsedFilters?.namespace;
      const preselectedNamespaces = Array.isArray(preselectedNamespacesRaw)
        ? preselectedNamespacesRaw
        : [];

      if (preselectedNamespaces.length > 0) {
        // Use preselected namespaces, skip overwriting setFilters
        namespaceFilterInitializedRef.current = true;
        setNamespacesToFetch(preselectedNamespaces);
      } else {
        // Performance optimization: start with lastUsedNamespace
        const validLastUsed = namespaces.find((n) => n.metadata.name === lastUsedNamespace);

        // Use last used namespace, or fall back to first namespace
        const defaultNamespace = validLastUsed || namespaces[0];

        if (defaultNamespace) {
          namespaceFilterInitializedRef.current = true;
          setNamespacesToFetch([defaultNamespace.metadata.name]);
          // Auto-select the namespace in the filter to make it visible
          setFilters({
            ...unparsedFilters,
            namespace: [defaultNamespace.metadata.name],
          });
        } else {
          // No valid default: show empty state
          namespaceFilterInitializedRef.current = true;
          setNamespacesToFetch([]);
        }
      }
    }
  }, [loaded, namespaces, setFilters, unparsedFilters, lastUsedNamespace, threshold]);

  // Watch filter changes and add newly selected namespaces to fetch list
  React.useEffect(() => {
    const selectedNamespaceFilters = selectedNamespaces || [];

    if (namespaces.length > threshold && selectedNamespaceFilters.length > 0) {
      // Create a set of valid namespace names for O(1) lookup
      const validNamespaceNames = new Set(namespaces.map((ns) => ns.metadata.name));

      setNamespacesToFetch((prevFetched) => {
        const newNamespaces = selectedNamespaceFilters.filter(
          (ns) => !prevFetched.includes(ns) && validNamespaceNames.has(ns),
        );
        return [...prevFetched, ...newNamespaces];
      });
    }
  }, [selectedNamespaces, namespaces.length, namespaces, threshold]);

  return {
    namespacesToFetch,
    namespaceFilterInitializedRef,
  };
};
