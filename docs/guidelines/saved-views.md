# Saved Views

Saved views let users bookmark a filter + column configuration as a named view. Views are stored in `localStorage`, scoped per namespace, and appear as sub-items in the sidebar navigation.

## Architecture

```
src/shared/components/SavedViews/
├── types.ts                    # SavedView, SavedViewsConfig
├── utils.ts                    # Slug generation, storage key prefix
├── useSavedViews.ts            # CRUD hook (save, delete, rename, update)
├── useActiveSavedView.ts       # Reads ?view=<slug> from URL → SavedView
├── SavedViewActions.tsx         # Actions dropdown (Save / Edit / Update / Delete)
├── SavedViewNavSection.tsx      # Sidebar wrapper: NavExpandable or NavItem
├── SavedViewNavItems.tsx        # Renders saved view links inside NavExpandable
├── SavedViewSaveModal.tsx       # Modal for saving a new view
├── SavedViewRenameModal.tsx     # Modal for renaming a view
├── SavedViewDeleteModal.tsx     # Modal for confirming deletion
└── index.ts                     # Public exports
```

## Core Types

```ts
type SavedView = {
  slug: string;           // Unique identifier (e.g. "sv-a1b2c3d4")
  label: string;          // User-visible name
  searchParams: string;   // URL query string (without leading "?")
  columnStateKey: string; // localStorage key for column visibility state
  namespace: string;      // Namespace the view was created in
};

type SavedViewsConfig = {
  resourceKey: string;                       // Storage namespace (e.g. "pipeline-runs")
  columnKeyPrefix: string;                   // Prefix for column state keys
  routePathBuilder: (namespace: string) => string; // Builds the base URL for any namespace
};
```

## Adding Saved Views to a New Page

### 1. Define a `SavedViewsConfig`

In the page component or sidebar, create a memoised config:

```tsx
const savedViewsConfig = React.useMemo<SavedViewsConfig>(
  () => ({
    resourceKey: 'my-resource',
    columnKeyPrefix: 'my-cols',
    routePathBuilder: (ns) => MY_RESOURCE_PATH.createPath({ workspaceName: ns }),
  }),
  [],
);
```

### 2. Add the Sidebar Section

Use `SavedViewNavSection` in `AppSideBar.tsx`. It automatically renders:
- **`NavItem`** when no saved views exist (simple link)
- **`NavExpandable`** with saved view sub-items when views exist

```tsx
import { SavedViewNavSection, type SavedViewsConfig } from '~/shared/components/SavedViews';

<SavedViewNavSection
  title="My Resource"
  config={savedViewsConfig}
  isActive={isActive(MY_RESOURCE_PATH.path)}
  disabled={!namespace}
  href={namespace ? MY_RESOURCE_PATH.createPath({ workspaceName: namespace }) : undefined}
  data-test="my-resource-nav"
/>
```

The component handles:
- **Arrow vs title click** — Arrow toggles expand/collapse, title navigates to the page
- **Disabled state** — Applies disabled styling when no namespace is selected
- **Namespace awareness** — Reads saved views scoped to the current namespace

### 3. Add the Actions Dropdown in the Page Toolbar

Use `SavedViewActions` inside your page's toolbar:

```tsx
import { SavedViewActions, useActiveSavedView } from '~/shared/components/SavedViews';

const activeSavedView = useActiveSavedView('my-resource');

<SavedViewActions
  resourceKey="my-resource"
  columnKeyPrefix="my-cols"
  currentColumnStateKey={currentColumnStateKey}
  isFiltered={hasActiveFilters}
  activeSavedView={activeSavedView}
/>
```

The dropdown shows contextual actions:
- **Save view** — when filters are active but no saved view is loaded
- **Update view with new filters** — when the active view's params have changed
- **Edit view** — rename the active view
- **Delete** — remove the active view

### 4. Wire Up the URL Parameter

Saved views use `?view=<slug>` in the URL. When the page loads with this parameter, restore the view's filter state from `searchParams` and column state from `columnStateKey`.

## Storage

- Views are stored in `localStorage` under key `saved-views:<resourceKey>`
- Column visibility state is stored separately under `<columnKeyPrefix>:<slug>`
- Each view stores its `namespace`, enabling cross-namespace saved views in the sidebar

## Sidebar Behaviour

`SavedViewNavSection` renders differently based on state:

| State | Renders |
|-------|---------|
| No saved views | Plain `NavItem` with link |
| Has saved views | `NavExpandable` with `SavedViewNavItems` children |

`SavedViewNavItems` handles multi-namespace display:

| State | Renders |
|-------|---------|
| All views in one namespace | Flat list of links |
| Views across multiple namespaces | `NavGroup` headers per namespace with separators |

Clicking a cross-namespace saved view navigates to that namespace automatically.

## Testing

Mock the saved views module in sidebar tests:

```tsx
jest.mock('~/shared/components/SavedViews', () => ({
  SavedViewNavSection: ({ title, 'data-test': dataTest, ...rest }) => (
    <li data-test={dataTest} className={rest.disabled ? 'app-side-bar__nav-item--disabled' : ''}>
      {typeof title === 'string' ? title : 'My Resource'}
    </li>
  ),
}));
```

For page-level tests, mock `useSavedViews` and `useActiveSavedView`:

```tsx
jest.mock('~/shared/components/SavedViews/useSavedViews');
jest.mock('~/shared/components/SavedViews/useActiveSavedView');
```
