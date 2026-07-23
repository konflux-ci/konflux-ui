# Guided Tours Guide

This document explains how to use the Guided Tours system in `src/shared/components/GuidedTours/`. It provides a config-driven way to walk users through UI features with step-by-step tours.

## Overview

The Guided Tours system renders interactive walkthroughs that guide users through page features. Tours are defined as config objects, registered against route keys, and rendered automatically on first visit or manually from a help menu.

Each tour step is one of three types:

| Type | Visual | Use When |
|------|--------|----------|
| `modal` | Centered dialog, no element targeting | Welcome screens, introductions, summaries |
| `spotlight` | Full-page dim overlay with cutout around target element + popover | Drawing attention to a specific element while blocking the rest of the page |
| `highlight` | Ring outline around target element + popover | Pointing out an element while keeping the rest of the page visible |

**Location:** `src/shared/components/GuidedTours/`

## Quick Start

### 1. Define a tour config

```ts
// src/tours/applications-tour.ts
import { TourConfig } from '~/shared/components/GuidedTours';

export const applicationsTour: TourConfig = {
  id: 'applications-overview',
  route: 'ns/:workspaceName/applications',
  trigger: 'auto',
  steps: [
    {
      type: 'modal',
      title: 'Welcome to Applications',
      content: 'This page shows all applications in your workspace.',
    },
    {
      type: 'highlight',
      title: 'Create an Application',
      content: 'Click here to create your first application.',
      target: 'create-application-btn',
      position: 'bottom',
    },
    {
      type: 'modal',
      title: 'You are all set!',
      content: 'Explore the page to learn more.',
      closing: true,
    },
  ],
};
```

### 2. Register the tour

```ts
// src/tours/applications-tour.ts (same file, at module level)
import { registerTour } from '~/shared/components/GuidedTours';

registerTour(applicationsTour);
```

### 3. Add data-tour attributes to target elements

```tsx
<Button data-tour="create-application-btn">Create application</Button>
```

### 4. Wire up auto-trigger in the page component

```tsx
import { useTourAutoTrigger } from '~/shared/components/GuidedTours';

const ApplicationsPage = () => {
  useTourAutoTrigger('ns/:workspaceName/applications');
  return <>{/* page content */}</>;
};
```

The `TourProvider` and `TourRenderer` are already mounted at the app root -- you do not need to add them.

## Tour Configuration

### `TourConfig` interface

```ts
interface TourConfig {
  /** Unique identifier, also used as localStorage key */
  id: string;
  /** Route pattern to match (e.g., 'ns/:workspaceName/applications') */
  route: string;
  /** 'auto' = first visit trigger, 'manual' = help menu only */
  trigger: TourTrigger;
  /** If true + auto, show confirmation prompt before starting */
  prompt?: boolean;
  /** Controls ordering when merging (lower = earlier, default: 0) */
  priority?: number;
  /** Tour steps */
  steps: TourStepConfig[];
}
```

### Step types

All step types share a base config:

```ts
interface BaseStepConfig {
  title: string;
  content: string;
  /** Marks this as a closing step (affects hint insertion point) */
  closing?: boolean;
  /** Route override for cross-page steps */
  route?: string;
}
```

**Modal step** -- standalone dialog, no element targeting:

```ts
interface ModalStepConfig extends BaseStepConfig {
  type: 'modal';
  variant?: 'small' | 'medium'; // default: 'small'
}
```

**Spotlight step** -- full-page dim overlay with cutout around target + popover:

```ts
interface SpotlightStepConfig extends BaseStepConfig {
  type: 'spotlight';
  target: string;                // data-tour attribute value
  position?: PopoverPosition;    // 'top' | 'bottom' | 'left' | 'right' | 'auto'
}
```

**Highlight step** -- ring outline around target + popover (no overlay):

```ts
interface HighlightStepConfig extends BaseStepConfig {
  type: 'highlight';
  target: string;                // data-tour attribute value
  position?: PopoverPosition;    // 'top' | 'bottom' | 'left' | 'right' | 'auto'
}
```

## Registering Tours

Call `registerTour()` at module level. The function adds the config to an internal `Map<route, TourConfig[]>`.

```ts
import { registerTour, TourConfig } from '~/shared/components/GuidedTours';

const myTour: TourConfig = { /* ... */ };
registerTour(myTour);
```

Multiple tours can be registered for the same route -- they are merged at runtime (see [Merging and Hints](#merging-and-hints)).

**Where to put tour configs:** Create tour files under `src/tours/` or colocate with the feature they belong to. The only requirement is that the file is imported so `registerTour()` executes.

## Step Types in Detail

### Modal

Use for introductions, summaries, or any step that does not reference a specific UI element.

```ts
{
  type: 'modal',
  title: 'Welcome',
  content: 'Let us show you around.',
  variant: 'medium', // optional, default is 'small'
}
```

Renders a PatternFly `Modal` centered on screen. The user can close it via the X button (triggers skip/dismiss).

### Spotlight

Use when you want to focus the user on a specific element by dimming everything else. The target element gets a cutout in a full-page overlay, with a popover attached.

```ts
{
  type: 'spotlight',
  title: 'Your Pipeline Runs',
  content: 'This table shows recent pipeline runs.',
  target: 'pipeline-runs-table',
  position: 'bottom',
}
```

The overlay blocks interaction with the rest of the page. The target element is scrolled into view and remains interactive.

### Highlight

Use when you want to call attention to an element without blocking the rest of the page. Adds a CSS ring outline around the target with a popover.

```ts
{
  type: 'highlight',
  title: 'Filter Controls',
  content: 'Use these filters to narrow your results.',
  target: 'filter-toolbar',
  position: 'right',
}
```

The highlight ring is applied via the CSS class `guided-tours__highlight-ring` and removed when the step ends.

### When to use which

| Scenario | Type |
|----------|------|
| Welcome/intro message | `modal` |
| "Look at this one thing" with full focus | `spotlight` |
| "Notice this element" while page stays usable | `highlight` |
| Closing/summary message | `modal` with `closing: true` |

## Element Targeting

Spotlight and highlight steps find their target element via the `data-tour` attribute:

```tsx
// In any component
<div data-tour="my-target-id">...</div>
```

The step config references it by the attribute value:

```ts
{ type: 'highlight', target: 'my-target-id', /* ... */ }
```

Under the hood, `useTargetElement` does `document.querySelector('[data-tour="my-target-id"]')`. If the element is not immediately in the DOM (lazy/dynamic content), a `MutationObserver` watches for it with a 5-second timeout. Once found, the element is scrolled into view (`scrollIntoView({ behavior: 'smooth', block: 'center' })`).

The bounding rect is tracked on resize and scroll so overlays stay aligned.

### Naming conventions

Use kebab-case, scoped to the feature:

- `applications-create-btn`
- `pipeline-runs-table`
- `component-details-header`

## Merging and Hints

When multiple tour configs are registered for the same route, `collectAndMerge()` combines their steps into a single sequence at runtime.

### How merging works

1. Filter out already-seen entries (by `seen` storage)
2. Sort by `priority` (lower number = earlier, default `0`)
3. Separate into **multi-step** entries (2+ steps) and **single-step hints** (1 step)
4. Multi-step entries contribute their steps in priority order
5. Single-step hints insert before the first step marked `closing: true`
6. If no closing step exists, hints append at the end

### Example

```ts
// Tour A: priority 0 (default)
registerTour({
  id: 'app-tour',
  route: 'ns/:workspaceName/applications',
  trigger: 'auto',
  steps: [
    { type: 'modal', title: 'Welcome', content: '...' },
    { type: 'modal', title: 'Goodbye', content: '...', closing: true },
  ],
});

// Tour B: single-step hint, priority 10
registerTour({
  id: 'app-hint-filters',
  route: 'ns/:workspaceName/applications',
  trigger: 'auto',
  priority: 10,
  steps: [
    { type: 'highlight', title: 'Filters', content: '...', target: 'filter-toolbar' },
  ],
});
```

Merged result:
1. `Welcome` (from app-tour)
2. `Filters` (hint inserted before closing step)
3. `Goodbye` (closing step from app-tour)

### The `closing` flag

Mark a step as `closing: true` to define the insertion point for hints. Typically the last step of a multi-step tour is the closing step (farewell/summary). Hints from other tour configs slot in before it.

## Persistence

Tour completion state is stored in `localStorage` under the key `konflux-tours`.

```ts
// localStorage shape
{
  "konflux-tours": {
    "applications-overview": { "status": "completed", "timestamp": 1719000000000 },
    "app-hint-filters": { "status": "dismissed", "timestamp": 1719000000000 }
  }
}
```

Two statuses:

| Status | Meaning |
|--------|---------|
| `completed` | User clicked "Done" on the last step |
| `dismissed` | User clicked "Skip" or closed early |

Both statuses prevent auto-trigger on subsequent visits. All source IDs involved in a merged tour are marked together when the user completes or dismisses.

To reset a tour for testing, clear the key from localStorage:

```js
// Browser console
const tours = JSON.parse(localStorage.getItem('konflux-tours'));
delete tours['applications-overview'];
localStorage.setItem('konflux-tours', JSON.stringify(tours));
```

## Trigger Mechanisms

### Auto-trigger (first visit)

`useTourAutoTrigger(routePattern)` runs on page mount. It:

1. Looks up all tours registered for the route with `trigger: 'auto'`
2. Filters out already-seen entries
3. Merges remaining entries via `collectAndMerge()`
4. Starts the tour if there are steps to show
5. Uses a ref to prevent re-triggering on the same route within the same session

```tsx
const MyPage = () => {
  useTourAutoTrigger('ns/:workspaceName/applications');
  // ...
};
```

### Manual trigger (help menu)

Use `useTour()` to start a tour programmatically, bypassing the seen filter:

```tsx
import { useTour, getToursByRoute } from '~/shared/components/GuidedTours';
import { collectAndMerge } from '~/shared/components/GuidedTours/merge-utils';

const HelpMenuItem = () => {
  const { startTour } = useTour();

  const handleClick = () => {
    const entries = getToursByRoute('ns/:workspaceName/applications');
    const { mergedSteps, sourceIds } = collectAndMerge(entries); // no seen filter
    if (mergedSteps.length > 0) {
      startTour(mergedSteps, sourceIds);
    }
  };

  return <button onClick={handleClick}>Show tour</button>;
};
```

Note: pass `seen` to `collectAndMerge()` to respect previously seen state, or omit it to always show the tour.

## Architecture

### File structure

```
src/shared/components/GuidedTours/
  index.ts              Public exports
  types.ts              TypeScript interfaces (TourConfig, step configs, state)
  consts.ts             Constants (TOUR_ACTIONS, TOUR_STATUS, STEP_TYPES, storage key, getTourElement)
  registry.ts           Tour registry (registerTour, getToursByRoute)
  merge-utils.ts        Step merging logic (collectAndMerge)
  tour-reducer.ts       useReducer state management (START, NEXT, PREV, SKIP, DONE)
  TourProvider.tsx       React context provider (wraps app root)
  TourRenderer.tsx       Step type dispatcher (renders ModalStep/SpotlightStep/HighlightStep)
  hooks/
    useTour.ts           Main hook (start, next, prev, skip, done, persistence)
    useTourAutoTrigger.ts Auto-trigger on first page visit
    useTargetElement.ts  DOM element lookup with MutationObserver + rect tracking
  steps/
    ModalStep.tsx        PatternFly Modal wrapper
    SpotlightStep.tsx    Full-page overlay + cutout + Popover
    SpotlightOverlay.tsx SVG overlay with rect cutout
    SpotlightOverlay.scss
    HighlightStep.tsx    CSS ring + Popover
    HighlightStep.scss
    StepNavigation.tsx   Back/Next/Done buttons + step counter
  __tests__/
    *.spec.ts(x)         Unit tests
```

### Data flow

```
Page mounts
    |
    v
useTourAutoTrigger(route)
    |
    v
getToursByRoute(route, 'auto')  -->  registry (Map<route, TourConfig[]>)
    |
    v
collectAndMerge(entries, seen)  -->  filter seen, sort by priority, merge steps
    |
    v
startTour(mergedSteps, sourceIds)  -->  dispatch(START)
    |
    v
TourRenderer reads state via useTour()
    |
    v
Renders ModalStep / SpotlightStep / HighlightStep based on currentStep.type
    |
    v
User clicks Next/Back/Skip/Done  -->  dispatch action  -->  update state / localStorage
```

### App wiring

`TourProvider` wraps the app at the router level (`src/routes/index.tsx`). `TourRenderer` should be placed inside the provider to render active tour steps. Individual pages call `useTourAutoTrigger()` to opt in to auto-triggering.

## Adding a New Tour -- Checklist

1. **Create the tour config file** -- define `TourConfig` with an `id`, `route`, `trigger`, and `steps` array
2. **Call `registerTour()`** at module level in the same file
3. **Import the file** so registration executes (e.g., import it in the page component or a central tour index)
4. **Add `data-tour` attributes** to any target elements referenced by spotlight/highlight steps
5. **Call `useTourAutoTrigger(route)`** in the page component if the tour uses `trigger: 'auto'`
6. **Test locally** -- clear `konflux-tours` from localStorage to re-trigger, verify each step renders correctly
7. **Write unit tests** -- see existing tests in `__tests__/` for patterns (mock `useTour`, verify step rendering)
