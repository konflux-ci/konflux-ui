import { SavedView } from './types';

export const STORAGE_KEY_PREFIX = 'saved-views';

export const generateSlug = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let random = '';
  for (let i = 0; i < 8; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return `sv-${random}`;
};

export const isSlugUnique = (slug: string, views: SavedView[]): boolean =>
  views.every((view) => view.slug !== slug);
