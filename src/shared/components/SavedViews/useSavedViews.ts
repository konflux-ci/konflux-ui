import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseAsString, useQueryState } from 'nuqs';
import { useLocalStorage } from '~/shared/hooks/useLocalStorage';
import { SavedView, SavedViewsConfig } from './types';
import { generateSlug, isSlugUnique, STORAGE_KEY_PREFIX } from './utils';

export const useSavedViews = (config: SavedViewsConfig) => {
  const { resourceKey, columnKeyPrefix } = config;
  const storageKey = `${STORAGE_KEY_PREFIX}:${resourceKey}`;
  const [activeViewSlug] = useQueryState('view', parseAsString);
  const navigate = useNavigate();

  const [views = [], setViews] = useLocalStorage<SavedView[]>(storageKey, []);

  const isSlugAvailable = useCallback(
    (slug: string): boolean => isSlugUnique(slug, views),
    [views],
  );

  const saveView = useCallback(
    ({
      slug: providedSlug,
      label,
      searchParams,
      currentColumnStateKey,
    }: {
      slug?: string;
      label: string;
      searchParams: string;
      currentColumnStateKey: string;
    }): string => {
      // Validate searchParams — strip leading '?' and ensure it parses
      let sanitizedParams = searchParams;
      if (sanitizedParams.startsWith('?')) {
        sanitizedParams = sanitizedParams.slice(1);
      }
      // Validate by attempting to parse; use empty string on failure
      try {
        new URLSearchParams(sanitizedParams);
      } catch {
        sanitizedParams = '';
      }

      // Ensure slug uniqueness — regenerate on collision
      let slug = providedSlug ?? generateSlug();
      if (!isSlugUnique(slug, views)) {
        slug = generateSlug();
      }

      const columnStateKey = `${columnKeyPrefix}:${slug}`;

      // Copy column state from current key to the new view's key
      const columnState = localStorage.getItem(currentColumnStateKey);
      if (columnState !== null) {
        localStorage.setItem(columnStateKey, columnState);
      }

      const newView: SavedView = { slug, label, searchParams: sanitizedParams, columnStateKey };
      setViews((prev) => [...(prev ?? []), newView]);

      return slug;
    },
    [columnKeyPrefix, setViews, views],
  );

  const deleteView = useCallback(
    (slug: string) => {
      const view = views.find((v) => v.slug === slug);

      if (view) {
        localStorage.removeItem(view.columnStateKey);
      }
      setViews((prev) => (prev ?? []).filter((v) => v.slug !== slug));
      if (activeViewSlug === slug) {
        navigate(`${config.routePath}?`, { replace: true });
      }
    },
    [views, setViews, activeViewSlug, config.routePath, navigate],
  );

  const renameView = useCallback(
    (slug: string, newLabel: string) => {
      setViews((prev) =>
        (prev ?? []).map((v) => (v.slug === slug ? { ...v, label: newLabel } : v)),
      );
    },
    [setViews],
  );

  const updateView = useCallback(
    (
      slug: string,
      {
        searchParams,
        currentColumnStateKey,
      }: { searchParams: string; currentColumnStateKey: string },
    ) => {
      // Copy column state outside the updater to keep it pure
      const columnStateKey = `${columnKeyPrefix}:${slug}`;
      const columnState = localStorage.getItem(currentColumnStateKey);
      if (columnState !== null) {
        localStorage.setItem(columnStateKey, columnState);
      }

      setViews((prev) => (prev ?? []).map((v) => (v.slug === slug ? { ...v, searchParams } : v)));
    },
    [columnKeyPrefix, setViews],
  );

  return { views, saveView, deleteView, renameView, updateView, isSlugAvailable };
};
