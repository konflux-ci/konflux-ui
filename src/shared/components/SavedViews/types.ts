export type SavedView = {
  slug: string;
  label: string;
  searchParams: string;
  columnStateKey: string;
};

export type SavedViewsConfig = {
  resourceKey: string;
  columnKeyPrefix: string;
  routePath: string;
};
