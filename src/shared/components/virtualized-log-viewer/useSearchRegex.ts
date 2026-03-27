import React from 'react';

/**
 * Custom hook that creates a search regex from search text
 * Escapes special regex characters and creates case-insensitive global regex
 */
export function useSearchRegex(searchText: string) {
  // Escape special regex characters
  const escapedSearchText = React.useMemo(() => {
    if (!searchText) return undefined;
    return searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, [searchText]);

  // Create regex with escaped text
  const searchRegex = React.useMemo(() => {
    if (!escapedSearchText) return undefined;
    return new RegExp(`(${escapedSearchText})`, 'gi');
  }, [escapedSearchText]);

  return searchRegex;
}
