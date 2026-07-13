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
    <Content>{title}</Content>
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
    {error && (
      <Alert isInline variant="danger" title="Error">
        {error}
      </Alert>
    )}
  </StackItem>
</Stack>;
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

| Need                           | Component                                           |
| ------------------------------ | --------------------------------------------------- |
| Horizontal row of items        | `Flex`                                              |
| Right-aligned element in a row | `Flex` > `Flex align={{ default: 'alignRight' }}`   |
| Vertical list with spacing     | `Stack hasGutter`                                   |
| Center a spinner/empty state   | `Bullseye`                                          |
| Page content section           | `PageSection variant={PageSectionVariants.light}`   |
| Two-column detail view         | `Flex` with `flex={{ default: 'flex_3' }}` children |

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
</AnalyticsButton>;
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
</Tooltip>;
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
</ButtonWithAccessTooltip>;
```

## Alert

Always use `isInline` inside forms and modals:

```tsx
import { Alert, AlertVariant } from '@patternfly/react-core';

// Error alert in a form/modal
{
  error && (
    <Alert isInline variant={AlertVariant.danger} title="An error occurred">
      {error}
    </Alert>
  );
}

// Info alert for unsaved changes
<Alert isInline variant="info" title="You made changes to this page.">
  Click Save to save changes or Reload to cancel changes.
</Alert>;
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

### When to Use Which

| Scenario                                                                  | Use                                                                                       |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Simple modal where title, variant, and data-test are enough               | `createModalLauncher` — modal chrome (title, variant, close) is handled for you           |
| Modal with custom header, description, footer, or composable API features | `createRawModalLauncher` — you control `ModalHeader`, `ModalBody`, `ModalFooter` directly |

### Composable Modal with `createRawModalLauncher`

For modals that need full control over layout (custom headers, descriptions, footers), use `createRawModalLauncher` with PF v6's composable `Modal`:

```tsx
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { createRawModalLauncher, RawComponentProps } from '~/components/modal/createModalLauncher';

const MyModal: React.FC<RawComponentProps> = ({ onClose, modalProps }) => {
  const { isOpen, appendTo, ...rest } = modalProps || {};
  return (
    <Modal
      {...rest}
      isOpen={isOpen}
      onClose={onClose}
      appendTo={appendTo}
      variant={ModalVariant.small}
    >
      <ModalHeader title="My Modal Title" description="Optional description text" />
      <ModalBody>{/* modal content */}</ModalBody>
      <ModalFooter>{/* action buttons */}</ModalFooter>
    </Modal>
  );
};

export const myModalLauncher = createRawModalLauncher(MyModal, { 'data-test': 'my-modal' });
```

> **Note:** Do not import `Modal` from `@patternfly/react-core/deprecated`. Use the composable `Modal` from `@patternfly/react-core`.

### Modal Variants

| Variant               | Width | Use For                     |
| --------------------- | ----- | --------------------------- |
| `ModalVariant.small`  | 560px | Confirmations, simple forms |
| `ModalVariant.medium` | 768px | Standard forms              |
| `ModalVariant.large`  | 992px | Complex content, tables     |

## Toolbar

```tsx
import { Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';

<Toolbar className="pf-v6-u-py-md" clearAllFilters={onClearFilters}>
  <ToolbarContent>
    <ToolbarItem className="pf-v6-u-ml-0">
      <SearchInput
        placeholder="Filter by name..."
        onChange={(_, value) => onTextInput(value)}
        value={text}
      />
    </ToolbarItem>
    <ToolbarItem alignSelf="center">{children}</ToolbarItem>
  </ToolbarContent>
</Toolbar>;
```

Use `className="pf-v6-u-py-md"` for vertical spacing. Use `clearAllFilters` callback for filter reset.

## Empty States

Use the three shared empty state wrappers. Never use raw PF `EmptyState` in feature components.

| Component            | Use For                        |
| -------------------- | ------------------------------ |
| `AppEmptyState`      | Zero data (no resources exist) |
| `FilteredEmptyState` | Filters yielded no results     |
| `ErrorEmptyState`    | Error loading data             |

```tsx
import {
  AppEmptyState,
  FilteredEmptyState,
  ErrorEmptyState,
} from '~/shared/components/empty-state';

// In table: EmptyMsg / NoDataEmptyMsg
<Table
  EmptyMsg={FilteredEmptyState}
  NoDataEmptyMsg={() => <AppEmptyState emptyStateImg={MyImage} title="No resources yet" />}
/>;

// Direct usage
if (error) return <ErrorEmptyState httpError={error} />;
```

## Tabs

All tabs are router-driven via `TabsLayout`. Never manage tab state with `useState`:

```tsx
// Define tabs as data
const tabs: DetailsPageTabProps[] = [
  { key: '', label: 'Overview', isFilled: true }, // index route
  { key: 'pipelineruns', label: 'Pipeline runs' },
  { key: 'activity', label: 'Activity', partial: true }, // matches /activity/*
];

// TabsLayout renders PF Tabs + <Outlet />
<TabsLayout id="my-details" tabs={tabs} headTitle="My Resource" baseURL={baseURL} />;
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
</LabelGroup>;
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
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
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
</DescriptionList>;
```

## Design Tokens

### Spacing Tokens (SCSS)

Use PatternFly design tokens. Never hardcode pixel values.

```scss
// Spacing scale
gap: var(--pf-t--global--spacer--xs); // 4px
gap: var(--pf-t--global--spacer--sm); // 8px
gap: var(--pf-t--global--spacer--md); // 16px
gap: var(--pf-t--global--spacer--lg); // 24px
gap: var(--pf-t--global--spacer--xl); // 32px
gap: var(--pf-t--global--spacer--2xl); // 48px
gap: var(--pf-t--global--spacer--3xl); // 64px
```

### Color Tokens

```scss
// Semantic colors
color: var(--pf-t--global--color--status--danger--default); // errors
color: var(--pf-t--global--color--status--warning--default); // warnings
color: var(--pf-t--global--color--status--success--default); // success
color: var(--pf-t--global--color--status--info--default); // info
color: var(--pf-t--global--text--color--disabled); // muted
color: var(--pf-t--global--text--color--link--default); // links

// Background
background-color: var(--pf-t--global--background--color--secondary--default);

// Border
border: var(--pf-t--global--border--width--regular) solid
  var(--pf-t--global--border--color--default);
```

### Typography Tokens

```scss
font-size: var(--pf-t--global--font--size--sm);
font-size: var(--pf-t--global--font--size--md);
font-size: var(--pf-t--global--font--size--lg);
font-weight: var(--pf-t--global--font--weight--heading--bold);
font-family: var(--pf-t--global--font--family--mono);
```

### Inline Style Tokens (TSX)

Only acceptable inline styles are PF token references:

```tsx
<Flex style={{ marginTop: 'var(--pf-t--global--spacer--md)' }}>
<Stack style={{ marginTop: 'var(--pf-t--global--spacer--lg)' }} hasGutter>
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
  padding: var(--pf-t--global--spacer--md);

  &__header {
    margin-bottom: var(--pf-t--global--spacer--sm);
  }

  &--compact {
    padding: var(--pf-t--global--spacer--sm);
  }

  // Override PF component token within this component scope
  .pf-v6-c-description-list {
    --pf-v6-c-description-list--GridTemplateColumns: repeat(3, 1fr);
  }
}
```

## PF v6 Migration Gotchas

Behavioral changes in PatternFly v6 that can cause subtle bugs:

| Change                                          | Impact                                                                                     | Fix                                                                                                          |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Drawer padding uses direct-child CSS selectors  | Wrapper divs between `DrawerPanelContent` and `DrawerHead`/`DrawerPanelBody` break padding | Keep Drawer subcomponents as direct children                                                                 |
| `MenuContent` applies `overflow:hidden`         | Components like `Tabs` that render outside their bounds get clipped                        | Place such components outside `MenuContent`                                                                  |
| Modal accessible name includes all text content | Test assertions with exact `{ name: '...' }` may break                                     | Use regex: `{ name: /My Modal Title/ }`                                                                      |
| `EmptyStateHeader`, `EmptyStateIcon` removed    | Import errors                                                                              | Use `EmptyState` props (`headingLevel`, `titleText`, `icon`) directly                                        |
| `Text`/`TextContent` removed                    | Import errors                                                                              | Use `Content` with `ContentVariants`                                                                         |
| `Chip`/`ChipGroup` deprecated                   | Moved to `@patternfly/react-core/deprecated`                                               | Use `Label`/`LabelGroup`                                                                                     |
| `icon-button-group` toolbar variant removed     | Type error on `ToolbarGroup`                                                               | Use `action-group-plain` or remove the variant                                                               |
| JS token imports renamed                        | `global_palette_*`, `global_danger_color_*` etc. no longer exist                           | Use `t_global_*` equivalents (e.g., `global_danger_color_100` → `t_global_icon_color_status_danger_default`) |
| CSS class prefix `pf-v5-c-*` → `pf-v6-c-*`      | SCSS overrides and utility classes targeting `pf-v5-` break                                | Update to `pf-v6-c-*` and `pf-v6-u-*`                                                                        |
| OUIA component type prefix `PF5/` → `PF6/`      | E2E selectors using `data-ouia-component-type="PF5/..."` break                             | Update to `PF6/` prefix                                                                                      |
| `formik-pf` package removed                     | Import errors                                                                              | Use `~/shared/components/formik-base/`                                                                       |

## Deprecated PF APIs to Avoid

PF v6 removed `@patternfly/react-core/deprecated` entirely. All components that previously lived there (Dropdown, Select, Modal, Chip/ChipGroup) have already been migrated to their composable equivalents. Do not re-introduce imports from `@patternfly/react-core/deprecated`.

## Common Pitfalls — Composable Component DOM Semantics

When migrating from deprecated PF APIs to the composable equivalents (`Select`, `Menu`, `Dropdown`), pay attention to DOM semantics. The composable API gives you full control over the markup, which means you are responsible for valid HTML nesting.

### Divider inside list containers

`SelectList`, `MenuList`, and `DropdownList` render a `<ul>` element. A `<Divider />` renders `<hr>` by default, which is not a valid child of `<ul>`. Always set `component="li"`:

```tsx
// ✅ Correct — valid inside <ul>
<SelectList>
  <SelectOption value="option-1">Option 1</SelectOption>
  <Divider component="li" />
  <SelectOption value="option-2">Option 2</SelectOption>
</SelectList>

// ❌ Wrong — <hr> is invalid inside <ul>
<SelectList>
  <SelectOption value="option-1">Option 1</SelectOption>
  <Divider />
  <SelectOption value="option-2">Option 2</SelectOption>
</SelectList>
```

The same rule applies to `MenuList` and `DropdownList`.

### MenuToggle ref forwarding

The composable `Select`, `Menu`, and `Dropdown` require a `toggle` render function that receives a `ref`. You **must** forward this ref to `MenuToggle` — without it, Popper positioning and outside-click detection break silently:

```tsx
<Select
  toggle={(toggleRef) => (
    <MenuToggle ref={toggleRef} onClick={onToggle}>
      {selected || 'Select an option'}
    </MenuToggle>
  )}
>
  <SelectList>{/* options */}</SelectList>
</Select>
```

### SelectOption and value types

In the composable `Select`, `SelectOption` requires an explicit `value` prop. If you omit it, click handlers receive `undefined`. When using object values, provide a `toString()` method or use `itemId` for identification.

## Component Wrapping Decision Guide

| Need                            | Use                                                    |
| ------------------------------- | ------------------------------------------------------ |
| Button in feature component     | `AnalyticsButton`                                      |
| Button with RBAC tooltip        | `ButtonWithAccessTooltip`                              |
| External link                   | `ExternalLink` from `~/shared/components/links/`       |
| Action menu / kebab             | `ActionMenu` from `~/shared/components/action-menu/`   |
| Loading/error wrapper           | `StatusBox` from `~/shared/components/status-box/`     |
| Simple modal                    | `createModalLauncher` + `useModalLauncher`             |
| Modal with custom header/footer | `createRawModalLauncher` + `useModalLauncher`          |
| Timestamp display               | `Timestamp` from `~/shared/components/timestamp/`      |
| Text truncation                 | `Truncate` from `~/shared/components/truncate-text/`   |
| Overflow list with popover      | `TruncatedLinkListWithPopover`                         |
| Skeleton placeholder            | `LoadingSkeleton` from `~/shared/components/skeleton/` |
