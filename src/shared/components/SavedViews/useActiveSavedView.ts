import { useSearchParams } from 'react-router-dom';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { SavedView } from './types';

/**
 * Reads `?view=<slug>` from the URL and returns the matching SavedView
 * from localStorage, or undefined if no match is found.
 */
export const useActiveSavedView = (resourceKey: string): SavedView | undefined => {
  const [searchParams] = useSearchParams();
  const [views] = useLocalStorage<SavedView[]>(`saved-views:${resourceKey}`, []);

  const slug = searchParams.get('view');
  if (!slug) return undefined;

  return views?.find((v) => v.slug === slug);
};
