import React from 'react';
import { useLocation } from 'react-router-dom';

interface UseScrollToHashOptions {
  /** Whether the data has finished loading */
  loaded: boolean;
  /** Whether there was an error loading the data */
  loadErr?: boolean;
  /** Delay in milliseconds before scrolling (default: 100) */
  delay?: number;
  /** Scroll behavior (default: 'smooth') */
  behavior?: ScrollBehavior;
  /** Block alignment (default: 'start') */
  block?: ScrollLogicalPosition;
}

/**
 * Custom hook that scrolls to a hash fragment in the URL after data is loaded.
 * This is useful for deep-linking to specific sections of a page.
 *
 * @param options - Configuration options for the scroll behavior
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useQuery(...);
 *
 * useScrollToHash({
 *   loaded: !isLoading,
 *   loadErr: !!error,
 *   delay: 150,
 *   behavior: 'smooth'
 * });
 * ```
 */
export const useScrollToHash = ({
  loaded,
  loadErr = false,
  delay = 100,
  behavior = 'smooth',
  block = 'start',
}: UseScrollToHashOptions) => {
  const location = useLocation();

  React.useEffect(() => {
    if (loaded && !loadErr && location.hash) {
      const timer = setTimeout(() => {
        const element = document.getElementById(location.hash.substring(1));
        if (element) {
          element.scrollIntoView({ behavior, block });
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [loaded, loadErr, location.hash, delay, behavior, block]);
};
