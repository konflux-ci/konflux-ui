# PatternFly Usage Guidelines

This document defines how PatternFly (PF) components, layout primitives, design tokens, and icons are used in konflux-ui.

## Core Principle

**Always use PatternFly components instead of raw HTML.** Never write `<div style={{ display: 'flex' }}>` when `<Flex>` exists. Never use `<button>` when `<Button>` exists.

## Layout Components

### Flex / FlexItem -- Primary Row Layout

Use `Flex` for horizontal layouts. All responsive props use `{ default: 'value' }` object syntax.

```tsx
import { Flex, FlexItem } from '@patternfly/react-core';

// Row with right-aligned element
<Flex>
  <FlexItem>
    <TextContent>{title}</TextContent>
  </FlexItem>
  <Flex align={{ default: 'alignRight' }}>
    <FlexItem>
      <ActionMenu actions={actions} />
    </FlexItem>
  </Flex>
</Flex>

// Column direction
<Flex direction={{ default: 'column' }}>
  <FlexItem>First</FlexItem>
  <FlexItem>Second</FlexItem>
</Flex>

// Proportional widths
<Flex>
  <Flex flex={{ default: 'flex_3' }}>Left column (75%)</Flex>
  <Flex flex={{ default: 'flex_1' }}>Right column (25%)</Flex>
</Flex>

// Justify content
<Flex justifyContent={{ default: 'justifyContentFlexStart' }}>
  <FlexItem>...</FlexItem>
</Flex>
```

### Stack / StackItem -- Vertical Stacking

Use `Stack` for vertical lists and modal content. Almost always use `hasGutter`.

```tsx
import { Stack, StackItem } from '@patternfly/react-core';

<Stack hasGutter>
  <StackItem>Section 1</StackItem>
  <StackItem>Section 2</StackItem>
  <StackItem>
    {error && <Alert isInline variant="danger" title="Error">{error}</Alert>}
  </StackItem>
</Stack>
```

### Bullseye -- Centering

Use `Bullseye` for centering content, especially loading spinners:

```tsx
import { Bullseye, Spinner } from '@patternfly/react-core';

if (!loaded) {
  return (
    <Bullseye>
      <Spinner />
    </Bullseye>
  );
}
```

### PageSection -- Page-Level Sections

```tsx
import { PageSection, PageSectionVariants } from '@patternfly/react-core';

// Light variant for content areas
<PageSection variant={PageSectionVariants.light} isFilled>
  {content}
</PageSection>

// Breadcrumb section
<PageSection type="breadcrumb">
  <BreadCrumbs breadcrumbs={breadcrumbs} />
</PageSection>
```

### Layout Decision Guide

| Need | Component |
|---|---|
| Horizontal row of items | `Flex` |
| Right-aligned element in a row | `Flex` > `Flex align={{ default: 'alignRight' }}` |
| Vertical list with spacing | `Stack hasGutter` |
| Center a spinner/empty state | `Bullseye` |
| Page content section | `PageSection variant="light"` |
| Two-column detail view | `Flex` with `flex={{ default: 'flex_3' }}` children |

**Not used in this codebase:** `Split`/`SplitItem`, `Gallery`. Prefer `Flex` for all horizontal layouts.

## Button

### Always Use AnalyticsButton

In feature components, use `AnalyticsButton` instead of raw PF `Button`. It wraps `Button` with analytics tracking:

```tsx
import AnalyticsButton from '~/components/AnalyticsButton/AnalyticsButton';

<AnalyticsButton
  variant={ButtonVariant.primary}
  analytics={{ link_name: 'create-component', app_name: applicationName }}
  onClick={handleCreate}
>
  Create component
</AnalyticsButton>
```

Raw `Button` is acceptable only in shared/utility components.

### Button Variants

```tsx
<Button variant={ButtonVariant.primary}>Primary action</Button>
<Button variant={ButtonVariant.secondary}>Secondary action</Button>
<Button variant={ButtonVariant.link}>Link action</Button>
<Button variant={ButtonVariant.danger}>Destructive action</Button>
<Button variant={ButtonVariant.plain}>Icon-only button</Button>
```

### Disabled Buttons

**Never use `isDisabled` alone.** Always use `isAriaDisabled` wrapped in a `Tooltip`:

```tsx
import { Tooltip } from '@patternfly/react-core';

<Tooltip content="You do not have permission to perform this action">
  <AnalyticsButton variant="primary" isAriaDisabled>
    Create
  </AnalyticsButton>
</Tooltip>
```

`isAriaDisabled` keeps the button focusable for accessibility (tooltips don't work on elements with `disabled`).

The project has `ButtonWithAccessTooltip` for RBAC-gated buttons:

```tsx
import ButtonWithAccessTooltip from '~/components/ButtonWithAccessTooltip';

<ButtonWithAccessTooltip
  variant="primary"
  isDisabled={!canCreate}
  tooltip="You do not have permission"
  analytics={{ link_name: 'create-resource' }}
>
  Create
</ButtonWithAccessTooltip>
```

## Alert

Always use `isInline` inside forms and modals:

```tsx
import { Alert, AlertVariant } from '@patternfly/react-core';

// Error alert in a form/modal
{error && (
  <Alert isInline variant={AlertVariant.danger} title="An error occurred">
    {error}
  </Alert>
)}

// Info alert for unsaved changes
<Alert isInline variant="info" title="You made changes to this page.">
  Click Save to save changes or Reload to cancel changes.
</Alert>
```

## Modal

### Use the Modal Launcher System

Never manage modal state with `useState(isOpen)` + raw `<Modal>`. Use the centralized system:

```tsx
import { createModalLauncher } from '~/components/modal/createModalLauncher';
import { useModalLauncher } from '~/components/modal/ModalProvider';

// 1. Create launcher
const myModalLauncher = createModalLauncher(MyModalContent, {
  'data-test': 'my-modal',
  variant: ModalVariant.small,
  title: 'My Modal Title',
});

// 2. Use in component
const showModal = useModalLauncher();
showModal(myModalLauncher({ prop1: value1 }));
```

### Modal Variants

| Variant | Width | Use For |
|---|---|---|
| `ModalVariant.small` | 560px | Confirmations, simple forms |
| `ModalVariant.medium` | 768px | Standard forms |
| `ModalVariant.large` | 992px | Complex content, tables |

## Toolbar

```tsx
import { Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';

<Toolbar usePageInsets clearAllFilters={onClearFilters}>
  <ToolbarContent>
    <ToolbarItem className="pf-v5-u-ml-0">
      <SearchInput
        placeholder="Filter by name..."
        onChange={(_, value) => onTextInput(value)}
        value={text}
      />
    </ToolbarItem>
    <ToolbarItem alignSelf="center">
      {children}
    </ToolbarItem>
  </ToolbarContent>
</Toolbar>
```

Always include `usePageInsets` prop. Use `clearAllFilters` callback for filter reset.

## Empty States

Use the three shared empty state wrappers. Never use raw PF `EmptyState` in feature components.

| Component | Use For |
|---|---|
| `AppEmptyState` | Zero data (no resources exist) |
| `FilteredEmptyState` | Filters yielded no results |
| `ErrorEmptyState` | Error loading data |

```tsx
import { AppEmptyState, FilteredEmptyState, ErrorEmptyState } from '~/shared/components/empty-state';

// In table: EmptyMsg / NoDataEmptyMsg
<Table
  EmptyMsg={FilteredEmptyState}
  NoDataEmptyMsg={() => <AppEmptyState emptyStateImg={MyImage} title="No resources yet" />}
/>

// Direct usage
if (error) return <ErrorEmptyState httpError={error} />;
```

## Tabs

All tabs are router-driven via `TabsLayout`. Never manage tab state with `useState`:

```tsx
// Define tabs as data
const tabs: DetailsPageTabProps[] = [
  { key: '', label: 'Overview', isFilled: true },         // index route
  { key: 'pipelineruns', label: 'Pipeline runs' },
  { key: 'activity', label: 'Activity', partial: true },  // matches /activity/*
];

// TabsLayout renders PF Tabs + <Outlet />
<TabsLayout id="my-details" tabs={tabs} headTitle="My Resource" baseURL={baseURL} />
```

Always use `mountOnEnter` and `unmountOnExit` (set by default in `TabsLayout`).

## Labels

```tsx
import { Label, LabelGroup, Truncate } from '@patternfly/react-core';

<LabelGroup>
  {items.map((item) => (
    <Label key={item} color="blue">
      <Truncate content={item} />
    </Label>
  ))}
</LabelGroup>
```

## Tooltip / Popover

```tsx
import { Tooltip, Popover } from '@patternfly/react-core';

// Simple tooltip
<Tooltip content="Helpful information">
  <OutlinedQuestionCircleIcon />
</Tooltip>

// Popover with structured content
<Popover
  aria-label="More info"
  headerContent="Details"
  bodyContent={
    <Stack hasGutter>
      {items.map(item => <StackItem key={item.id}>{item.name}</StackItem>)}
    </Stack>
  }
>
  <Button variant="link" isInline>Show more</Button>
</Popover>
```

## DescriptionList

Used on detail page overview tabs for key-value display:

```tsx
import {
  DescriptionList, DescriptionListGroup,
  DescriptionListTerm, DescriptionListDescription,
} from '@patternfly/react-core';

<DescriptionList columnModifier={{ default: '1Col' }}>
  <DescriptionListGroup>
    <DescriptionListTerm>Name</DescriptionListTerm>
    <DescriptionListDescription>{resource.metadata.name}</DescriptionListDescription>
  </DescriptionListGroup>
  <DescriptionListGroup>
    <DescriptionListTerm>Created</DescriptionListTerm>
    <DescriptionListDescription>
      <Timestamp timestamp={resource.metadata.creationTimestamp} />
    </DescriptionListDescription>
  </DescriptionListGroup>
</DescriptionList>
```

## Design Tokens

### Spacing Tokens (SCSS)

Use PatternFly design tokens. Never hardcode pixel values.

```scss
// Spacing scale
gap: var(--pf-v5-global--spacer--xs);    // 4px
gap: var(--pf-v5-global--spacer--sm);    // 8px
gap: var(--pf-v5-global--spacer--md);    // 16px
gap: var(--pf-v5-global--spacer--lg);    // 24px
gap: var(--pf-v5-global--spacer--xl);    // 32px
gap: var(--pf-v5-global--spacer--2xl);   // 48px
gap: var(--pf-v5-global--spacer--3xl);   // 64px
```

### Color Tokens

```scss
// Semantic colors
color: var(--pf-v5-global--danger-color--100);     // errors
color: var(--pf-v5-global--warning-color--100);    // warnings
color: var(--pf-v5-global--success-color--100);    // success
color: var(--pf-v5-global--info-color--100);       // info
color: var(--pf-v5-global--disabled-color--100);   // muted
color: var(--pf-v5-global--link--Color);           // links

// Background
background-color: var(--pf-v5-global--BackgroundColor--200);

// Border
border: var(--pf-v5-global--BorderWidth--sm) solid var(--pf-v5-global--BorderColor--100);
```

### Typography Tokens

```scss
font-size: var(--pf-v5-global--FontSize--sm);
font-size: var(--pf-v5-global--FontSize--md);
font-size: var(--pf-v5-global--FontSize--lg);
font-weight: var(--pf-v5-global--FontWeight--bold);
font-family: var(--pf-v5-global--FontFamily--monospace);
```

### Inline Style Tokens (TSX)

Only acceptable inline styles are PF token references:

```tsx
<Flex style={{ marginTop: 'var(--pf-v5-global--spacer--md)' }}>
<Stack style={{ marginTop: 'var(--pf-v5-global--spacer--lg)' }} hasGutter>
```

## Icon Imports

Always use the deep ESM path. The barrel import is banned by ESLint:

```tsx
// Correct
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { ExternalLinkAltIcon } from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';

// Wrong -- banned by ESLint
import { CheckCircleIcon } from '@patternfly/react-icons';
```

The icon name in the path is the kebab-case version of the component name.

## CSS Utility: `css()` from `@patternfly/react-styles`

Use `css()` for conditional className merging alongside PF components:

```tsx
import { css } from '@patternfly/react-styles';

<EmptyState className={css('app-empty-state', isLarge && 'm-is-large', className)}>
```

## SCSS Conventions

- Use BEM naming: `.my-component`, `.my-component__element`, `.my-component--modifier`
- Always use PF design tokens for spacing, colors, typography
- Co-locate SCSS files with their component: `MyComponent.scss` next to `MyComponent.tsx`
- Never use `!important` -- fix specificity issues properly
- Scope overrides to component classes:

```scss
.my-component {
  // Custom styles using PF tokens
  padding: var(--pf-v5-global--spacer--md);

  &__header {
    margin-bottom: var(--pf-v5-global--spacer--sm);
  }

  &--compact {
    padding: var(--pf-v5-global--spacer--sm);
  }

  // Override PF component token within this component scope
  .pf-v5-c-description-list {
    --pf-v5-c-description-list--GridTemplateColumns: repeat(3, 1fr);
  }
}
```

## Deprecated PF APIs to Avoid

These deprecated APIs exist in the codebase but should not be used in new code:

| Deprecated | Use Instead |
|---|---|
| `Dropdown` from `@patternfly/react-core/deprecated` | `ActionMenu` from `~/shared/components/action-menu/` |
| `Select` from `@patternfly/react-core/deprecated` | `BasicDropdown` from `~/shared/components/dropdown/` or PF5 `Select` |
| `DropdownToggle` from `@patternfly/react-core/deprecated` | PF5 `MenuToggle` |

## Component Wrapping Decision Guide

| Need | Use |
|---|---|
| Button in feature component | `AnalyticsButton` |
| Button with RBAC tooltip | `ButtonWithAccessTooltip` |
| External link | `ExternalLink` from `~/shared/components/links/` |
| Action menu / kebab | `ActionMenu` from `~/shared/components/action-menu/` |
| Loading/error wrapper | `StatusBox` from `~/shared/components/status-box/` |
| Modal | `createModalLauncher` + `useModalLauncher` |
| Timestamp display | `Timestamp` from `~/shared/components/timestamp/` |
| Text truncation | `Truncate` from `~/shared/components/truncate-text/` |
| Overflow list with popover | `TruncatedLinkListWithPopover` |
| Skeleton placeholder | `LoadingSkeleton` from `~/shared/components/skeleton/` |
