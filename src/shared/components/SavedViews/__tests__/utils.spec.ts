import { SavedView } from '../types';
import { generateSlug, isSlugUnique } from '../utils';

describe('generateSlug', () => {
  it('should return a non-empty string', () => {
    expect(generateSlug()).toBeTruthy();
  });

  it('should start with "sv-" prefix', () => {
    expect(generateSlug()).toMatch(/^sv-/);
  });

  it('should have an 8-character random suffix', () => {
    const slug = generateSlug();
    const suffix = slug.replace('sv-', '');
    expect(suffix).toHaveLength(8);
  });

  it('should contain only URL-safe characters', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateSlug()).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('should generate unique slugs across 100 calls', () => {
    const slugs = new Set(Array.from({ length: 100 }, () => generateSlug()));
    expect(slugs.size).toBe(100);
  });
});

describe('isSlugUnique', () => {
  const views: SavedView[] = [
    {
      slug: 'sv-abc12345',
      label: 'View A',
      searchParams: 'status=running',
      columnStateKey: 'cols-a',
    },
    {
      slug: 'sv-def67890',
      label: 'View B',
      searchParams: 'status=failed',
      columnStateKey: 'cols-b',
    },
  ];

  it('should return true for a slug not in the list', () => {
    expect(isSlugUnique('sv-newslug1', views)).toBe(true);
  });

  it('should return false for an existing slug', () => {
    expect(isSlugUnique('sv-abc12345', views)).toBe(false);
  });

  it('should return true for an empty views array', () => {
    expect(isSlugUnique('sv-anything', [])).toBe(true);
  });
});
