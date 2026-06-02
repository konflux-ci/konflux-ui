# Layout and Page Patterns

This document describes the page layout patterns used in konflux-ui and how to compose new pages.

## Page Types

Every page in the application follows one of four patterns:

1. **List Page** -- Table with filters, toolbar, and empty states
2. **Detail Page** -- Tabs, breadcrumbs, actions dropdown
3. **Form Page** -- Create/edit form with validation and submission
4. **Modal Workflow** -- Dialog-based operations (delete, confirm)

## Layout Components

### `PageLayout` -- List and Form Pages

Location: `src/components/PageLayout/PageLayout.tsx`

Used for pages without tabs (list views, form pages). Renders a title bar with optional actions.

```tsx
import PageLayout from '~/components/PageLayout/PageLayout';

<PageLayout
  title="Secrets"
  description="Manage your build and deployment secrets."
  breadcrumbs={[
    { path: APPLICATION_LIST_PATH.createPath({ workspaceName: namespace }), name: 'Applications' },
    { path: '#', name: 'Secrets' },
  ]}
  actions={[
    {
      id: 'create-secret',
      label: 'Create secret',
      cta: () => navigate(createPath),
      disabled: !canCreate,
      disabledTooltip: 'You do not have permission to create secrets',
    },
  ]}
  footer={<FormFooter ... />}   {/* Optional: for form pages */}
>
  <PageSection variant={PageSectionVariants.light} isFilled>
    {children}
  </PageSection>
</PageLayout>
```

### `DetailsPage` -- Detail Pages with Tabs

Location: `src/components/DetailsPage/DetailsPage.tsx`

Used for resource detail views. Renders breadcrumbs, title, actions dropdown, and router-synced tabs.

```tsx
import DetailsPage from '~/components/DetailsPage/DetailsPage';

<DetailsPage
  headTitle={`${resourceName} | Konflux`}
  title={
    <Flex>
      <FlexItem>
        <Text component="h2">{resourceName}</Text>
      </FlexItem>
      <FlexItem>
        <StatusIcon status={resource.status} />
      </FlexItem>
    </Flex>
  }
  breadcrumbs={[
    ...applicationBreadcrumbs,
    { path: listPath, name: 'My Resources' },
    { path: '#', name: resourceName },
  ]}
  actions={[
    { key: 'edit', label: 'Edit', onClick: handleEdit },
    { type: 'separator', key: 'sep-1', label: '' },
    {
      key: 'delete',
      label: 'Delete',
      onClick: handleDelete,
      isDisabled: !canDelete,
      disabledTooltip: 'You do not have permission to delete this resource',
    },
  ]}
  tabs={[
    { key: '', label: 'Overview', isFilled: true },         // index route
    { key: 'pipelineruns', label: 'Pipeline runs', isFilled: true },
    { key: 'activity', label: 'Activity', partial: true },  // matches /activity/*
  ]}
  baseURL={baseURL}
/>
```

**Action type for DetailsPage:**

```ts
type Action = {
  key: string;
  label: React.ReactNode;
  onClick?: () => void;
  component?: React.ReactElement;         // For Link-based actions
  isDisabled?: boolean;
  disabledTooltip?: React.ReactNode;
  type?: 'separator' | 'section-label';   // Structural items
  hidden?: boolean;                       // Conditionally hide
};
```

**Tab type:**

```ts
type DetailsPageTabProps = {
  key: string;      // Route path segment ('' for index)
  label: string;    // Tab display text
  isFilled?: boolean;   // Tab content fills remaining height
  partial?: boolean;    // Match any path starting with key
  featureFlag?: string; // Show flag indicator badge
};
```

### `TabsLayout` -- Router-Synced Tabs

Location: `src/components/TabsLayout/TabsLayout.tsx`

Used inside `DetailsPage`. Renders PatternFly Tabs wired to React Router. Each tab renders `<Outlet />` for its child route content.

```tsx
// Tab navigation is automatic -- TabsLayout reads location.pathname
// and matches it against the basePath + tab keys
<Tabs
  activeKey={activeTab.key}
  onSelect={(_, key) => navigate(`${basePath}/${key}`)}
  mountOnEnter
  unmountOnExit
>
```

Always use `mountOnEnter` and `unmountOnExit` to avoid rendering inactive tab content.

## Page Patterns

### List Page Pattern

```
FilterContextProvider filterParams={['name', 'status']}
  |
  +-- PageLayout (title, description, actions)
      |
      +-- PageSection isFilled variant="light"
          |
          +-- BaseTextFilterToolbar
          |     +-- SearchInput (debounced)
          |     +-- Primary action button (ButtonWithAccessTooltip)
          |
          +-- Table (when data exists)
          |     +-- Header: getMyFeatureHeader()
          |     +-- Row: MyFeatureListRow
          |
          +-- FilteredEmptyState (filtered to zero results)
          +-- AppEmptyState (no data at all)
```

Key behaviors:
- Filter state lives in URL via `useSearchParamBatch`.
- `FilterContextProvider` declares which params are tracked.
- Primary action button uses `ButtonWithAccessTooltip` for RBAC gating.
- Loading state returns early: `<Bullseye><Spinner /></Bullseye>`.

### Detail Page Pattern

```
MyFeatureDetailsView (parent route element)
  |
  +-- DetailsPage
      +-- breadcrumbs: useApplicationBreadcrumbs() + resource-specific
      +-- title: complex JSX with status icon
      +-- actions: Action[] (dropdown items)
      +-- tabs: DetailsPageTabProps[]
      +-- TabsLayout -> <Outlet />
          +-- index -> MyFeatureOverviewTab
          +-- 'pipelineruns' -> PipelineRunsListView
          +-- 'activity/:activityTab' -> ActivityTab
```

**Overview tab content structure:**

```tsx
const MyFeatureOverviewTab: React.FC = () => (
  <>
    <Title headingLevel="h4" size="lg" className="pf-v6-u-mt-lg pf-v6-u-mb-lg">
      Resource details
    </Title>
    <Flex>
      <Flex flex={{ default: 'flex_3' }}>
        <DescriptionList columnModifier={{ default: '1Col' }}>
          <DescriptionListGroup>
            <DescriptionListTerm>Name</DescriptionListTerm>
            <DescriptionListDescription>{resource.metadata.name}</DescriptionListDescription>
          </DescriptionListGroup>
          {/* More fields... */}
        </DescriptionList>
      </Flex>
      <Flex flex={{ default: 'flex_3' }}>
        {/* Second column */}
      </Flex>
    </Flex>
  </>
);
```

### Form Page Pattern

```
MyFeatureView (Formik wrapper)
  |
  +-- Formik initialValues, validationSchema, handleSubmit
      |
      +-- MyFeatureForm (form fields)
          |
          +-- PageLayout (breadcrumbs, title, footer=<FormFooter />)
              |
              +-- PageSection isFilled variant="light"
                  |
                  +-- <Form onSubmit={handleSubmit}>
                      +-- <FormSection>
                          +-- InputField, DropdownField, etc.
```

The View-Form separation:
- **View component** -- owns Formik context, initial values, validation schema, submit handler
- **Form component** -- reads `useFormikContext()`, renders fields, passes `FormFooter` as layout footer

```tsx
// MyFeatureView.tsx
const MyFeatureView: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (values: MyFeatureFormValues, actions: FormikHelpers<...>) => {
    try {
      await K8sQueryCreateResource(/* ... */);
      navigate(successPath);
    } catch (e) {
      actions.setSubmitting(false);
      actions.setStatus({ submitError: (e as Error).message });
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {(formikProps) => <MyFeatureForm {...formikProps} />}
    </Formik>
  );
};

// MyFeatureForm.tsx
const MyFeatureForm: React.FC = () => {
  const { handleSubmit, isSubmitting, status, dirty, isValid, handleReset } = useFormikContext();

  return (
    <PageLayout
      title="Create My Feature"
      breadcrumbs={breadcrumbs}
      footer={
        <FormFooter
          handleSubmit={handleSubmit}
          handleCancel={() => navigate(-1)}
          handleReset={handleReset}
          isSubmitting={isSubmitting}
          disableSubmit={!dirty || !isValid || isSubmitting}
          errorMessage={status?.submitError}
        />
      }
    >
      <PageSection variant={PageSectionVariants.light} isFilled>
        <Form onSubmit={handleSubmit}>
          <InputField name="name" label="Name" required />
          <DropdownField name="type" label="Type" items={typeOptions} />
        </Form>
      </PageSection>
    </PageLayout>
  );
};
```

### Modal Workflow Pattern

Never use `useState(isOpen)` + raw `<Modal>`. Use the modal launcher system:

```tsx
// 1. Define a modal content component
const MyConfirmModal: React.FC<{ obj: MyKind; modalProps: ModalProps }> = ({ obj, modalProps }) => (
  <Stack hasGutter>
    <StackItem>Are you sure you want to process {obj.metadata.name}?</StackItem>
    <StackItem>
      <Button variant="primary" onClick={() => { doAction(); modalProps.onClose(); }}>
        Confirm
      </Button>
      <Button variant="link" onClick={modalProps.onClose}>Cancel</Button>
    </StackItem>
  </Stack>
);

// 2. Create a launcher factory
const myConfirmModalLauncher = createModalLauncher(MyConfirmModal, {
  'data-test': 'my-confirm-modal',
  variant: ModalVariant.small,
  title: 'Confirm action',
});

// 3. Launch from a component
const showModal = useModalLauncher();

const handleAction = () => {
  showModal(myConfirmModalLauncher({ obj: myResource }));
};
```

## Routing

### Route Definition

Routes are defined in `src/routes/page-routes/<feature>.tsx` and composed in `src/routes/index.tsx`.

```tsx
// src/routes/page-routes/my-feature.tsx
import { RouteObject } from 'react-router-dom';
import { MY_FEATURE_LIST_PATH, MY_FEATURE_DETAILS_PATH } from '~/routes/paths';

const myFeatureRoutes: RouteObject[] = [
  {
    path: MY_FEATURE_LIST_PATH.path,
    element: <MyFeatureListView />,
  },
  {
    path: MY_FEATURE_DETAILS_PATH.path,
    element: <MyFeatureDetailsLayout />,
    children: [
      { index: true, element: <MyFeatureOverviewTab /> },
      { path: 'pipelineruns', element: <PipelineRunsTab /> },
    ],
  },
];

export default myFeatureRoutes;
```

### Path Definitions

Use `buildRoute()` from `src/routes/utils.ts`:

```tsx
// src/routes/paths.ts
import { buildRoute } from './utils';

export const MY_FEATURE_LIST_PATH = WORKSPACE_PATH.extend('my-features');
export const MY_FEATURE_DETAILS_PATH = MY_FEATURE_LIST_PATH.extend(':myFeatureName');

// Usage in components
const listUrl = MY_FEATURE_LIST_PATH.createPath({ workspaceName: namespace });
const detailUrl = MY_FEATURE_DETAILS_PATH.createPath({
  workspaceName: namespace,
  myFeatureName: resource.metadata.name,
});
```

## Breadcrumb Conventions

Breadcrumbs are built as an array of `{ name: string, path: string }` objects or React elements:

```tsx
const breadcrumbs = [
  ...useApplicationBreadcrumbs(),  // "Applications" link + app name + switcher
  { path: MY_FEATURE_LIST_PATH.createPath({ workspaceName: namespace }), name: 'My Features' },
  { path: '#', name: resource.metadata.name },  // Current page (non-navigable)
];
```

## Action Menu Conventions

### For Detail Pages (DetailsPage Actions Dropdown)

```ts
const actions: Action[] = [
  { key: 'edit', label: 'Edit', onClick: () => navigate(editPath) },
  { key: 'download', label: 'Download YAML', onClick: () => downloadYaml(resource) },
  { type: 'separator', key: 'sep-1', label: '' },
  {
    key: 'delete',
    label: 'Delete',
    onClick: () => showModal(deleteModal(resource)),
    isDisabled: !canDelete,
    disabledTooltip: 'You do not have permission to delete this resource',
  },
];
```

### For List Pages and Shared Components (ActionMenu)

```ts
const actions: MenuOption[] = [
  {
    id: 'edit',
    label: 'Edit',
    cta: () => navigate(editPath),
  },
  {
    id: 'delete-group',
    label: 'Danger zone',
    children: [
      {
        id: 'delete',
        label: 'Delete',
        cta: () => showModal(deleteModal(resource)),
        disabled: !canDelete,
        disabledTooltip: 'You do not have permission',
      },
    ],
  },
];
```

## Loading and Error States

### Standard Loading State

```tsx
if (!loaded) {
  return (
    <Bullseye>
      <Spinner />
    </Bullseye>
  );
}
```

### Standard Error State

```tsx
import { ErrorEmptyState } from '~/shared/components/empty-state';

if (error) {
  return <ErrorEmptyState httpError={error} />;
}
```

`ErrorEmptyState` handles:
- 403 -> "Access Denied" message
- 404 -> Redirects to `NotFoundEmptyState`
- Other errors -> Generic error with the message
