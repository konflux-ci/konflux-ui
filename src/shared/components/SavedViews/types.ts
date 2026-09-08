export type SavedView = {
  slug: string;
  label: string;
  searchParams: string;
  columnStateKey: string;
  namespace: string;
};

export type SavedViewsConfig = {
  resourceKey: string;
  columnKeyPrefix: string;
  routePathBuilder: (namespace: string) => string;
};
