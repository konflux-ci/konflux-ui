# Analytics (Segment) Integration

Konflux UI uses [Segment](https://segment.com/) (Analytics.js 2.0) for product analytics. Segment acts as an abstraction layer that routes events to downstream destinations (Amplitude, Mixpanel, BigQuery, etc.) configured in the Segment dashboard — no UI code changes needed to add new destinations.

---

## Architecture Overview

```
main.tsx
  └── initAnalytics()                      # SDK initialization (non-blocking)
        └── loadAnalyticsConfig()           # Config resolution
              ├── fetch /segment/key + /segment/url   # Production: backend APIs
              └── window.KONFLUX_RUNTIME              # Local dev: runtime-config.js

App (main.tsx)                               # Renders after auth
  ├── useKonfluxPublicInfo()                 # Fetch version data from ConfigMap
  ├── setCommonProperties()                  # Set CommonFields if available
  └── consumeLoginSignal() → onLogin()       # Login event (once public info settles)

AuthContext.tsx
  └── onLogout() (on sign out)               # track user_logout + reset

Components
  └── useTrackAnalyticsEvent()               # Type-safe track hook
```

### Key files

| File | Purpose |
|------|---------|
| `src/analytics/index.ts` | SDK initialization, `getAnalytics()`, `whenAnalyticsReady()`, re-exports generated types |
| `src/analytics/load-config.ts` | Config resolution (API-first, runtime fallback) |
| `src/analytics/AnalyticsService.ts` | Service class — type-safe `track()`, `page()`, `identify()`, `reset()` |
| `src/analytics/gen/analytics-types.ts` | Auto-generated types from segment-bridge schema |
| `src/analytics/obfuscate.ts` | SHA-256 hashing for PIA fields (`SHA256Hash` branded type) |
| `src/analytics/hooks.ts` | `useTrackAnalyticsEvent` hook |
| `src/auth/useAuthAnalytics.ts` | `useAuthAnalytics` hook — `onLogin`/`onLogout` callbacks |
| `src/analytics/conditional-checks.ts` | `isAnalyticsEnabled` condition + `useIsAnalyticsEnabled` hook |
| `src/analytics/types.ts` | `AnalyticsConfig` type |
| `src/registers.ts` | Registers the `isAnalyticsEnabled` condition |

---

## Configuration

### Production / Staging

The Segment write key and API URL are served by the backend via two endpoints:

- `GET /segment/key` — returns the Segment write key as `text/plain`
- `GET /segment/url` — returns the Segment API host as `text/plain`

`loadAnalyticsConfig()` fetches both in parallel. Responses must have `content-type: text/plain` — this guards against webpack's `historyApiFallback` returning HTML on local dev.

### Local Development

When the `/segment/*` APIs are unavailable (local dev), config falls back to `window.KONFLUX_RUNTIME` values set in `public/runtime-config.js`:

```js
window.KONFLUX_RUNTIME.ANALYTICS_ENABLED = 'true';    // or 'false' to disable
window.KONFLUX_RUNTIME.ANALYTICS_WRITE_KEY = 'your-key';
window.KONFLUX_RUNTIME.ANALYTICS_API_URL = 'your-host';
```

The type declarations for these fields live in `@types/index.d.ts`.

### Config Resolution Order

1. Fetch `/segment/key` + `/segment/url` (must be `text/plain`, non-empty key)
2. If that fails → read `window.KONFLUX_RUNTIME.ANALYTICS_*` fields
3. If disabled or missing → analytics is off, SDK is not loaded

---

## Initialization

Analytics initializes in `main.tsx` alongside monitoring via `Promise.allSettled()`:

```ts
const initializers = [
  { name: 'monitoring', context: 'initMonitoring', init: initMonitoring },
  { name: 'analytics', context: 'initAnalytics', init: initAnalytics },
];
void Promise.allSettled(initializers.map(({ init }) => init()));
```

- **Non-blocking** — the app renders immediately, initialization happens in the background
- **Code-split** — the `@segment/analytics-next` SDK is dynamically imported and only loaded when analytics is enabled
- **Failure-safe** — if initialization fails, the app continues normally; all analytics calls become no-ops

### Deferred Ready Promise

`initAnalytics()` resolves a deferred promise (`whenAnalyticsReady()`) to `true` on success or `false` on failure/disabled. This is used by the conditions system to reliably determine analytics state without race conditions:

```ts
// Safe to call at any time — waits for init to complete
const isReady = await whenAnalyticsReady(); // true or false
```

This avoids the problem of a boolean flag being checked before initialization completes and getting cached permanently as `false`.

---

## AnalyticsService

The `AnalyticsService` class is the primary interface for tracking. A singleton instance is exported as `analyticsService`.

### API

```ts
import { analyticsService } from '~/analytics/AnalyticsService';
import { TrackEvents } from '~/analytics';
import { obfuscate } from '~/analytics/obfuscate';

// Set CommonFields — merged into every track() and page() call
analyticsService.setCommonProperties({
  clusterVersion: '4.14',
  konfluxVersion: '1.2.3',
  kubernetesVersion: '1.30',
});

// Track a typed event (event name → required properties enforced at compile time)
const userId = await obfuscate(rawUsername);
analyticsService.track(TrackEvents.feedback_submitted_event, {
  userId,
  rating: 5,
  feedback: 'Great experience',
});

// Track a page view
analyticsService.page('Application Details', { app_id: '123' });

// Identify a user (called automatically by useAuthAnalytics on login)
analyticsService.identify(user);

// Reset Segment identity (called automatically by useAuthAnalytics on logout)
analyticsService.reset();
```

### Type-safe `track()`

The `track` method uses a generic signature tied to `EventPropertiesMap`:

```ts
track<E extends TrackEvents>(event: E, properties: EventPropertiesMap[E]): void
```

Each `TrackEvents` enum value maps to the event-specific properties (minus `CommonFields`, which are merged automatically). This means the compiler enforces the correct payload shape for each event.

### Common Properties (`CommonFields`)

`setCommonProperties()` accepts `Partial<CommonFields>` — the base fields required on every Segment event (cluster version, Konflux version, etc.). These are automatically merged into every `track()` and `page()` call.

Use the `useAnalyticsCommonProperties` hook to set them from the React tree once version data is available:

```ts
import { useAnalyticsCommonProperties } from '~/analytics/hooks';

const App = () => {
  useAnalyticsCommonProperties({
    clusterVersion: info.clusterVersion,
    konfluxVersion: info.konfluxVersion,
    kubernetesVersion: info.kubernetesVersion,
  });
  return <Routes />;
};
```

### Direct SDK Access

For advanced use cases, the raw Segment instance is available:

```ts
import { getAnalytics } from '~/analytics';

const analytics = getAnalytics(); // Analytics | undefined
analytics?.track('raw event', { ... });
```

Always handle the `undefined` case — analytics may be disabled or not yet initialized.

---

## User Identity & Login Detection

### How Login Detection Works

The OAuth2 proxy handles authentication. The challenge is distinguishing a real login from a page refresh (both call `/oauth2/userinfo` on load). The solution uses a URL query parameter:

1. User visits the app, `/oauth2/userinfo` returns 401
2. `redirectToLogin()` redirects to `/oauth2/sign_in?rd=/original/path?logged_in=1`
3. User authenticates externally, oauth2-proxy redirects back to `/original/path?logged_in=1`
4. `AuthProvider` sets `isAuthenticated = true`, `App` renders
5. `App` waits for `useKonfluxPublicInfo()` to settle (loaded or error)
6. If version fields are present in the ConfigMap, `analyticsService.setCommonProperties(...)` is called
7. `consumeLoginSignal()` detects the `logged_in` param, strips it from the URL, returns `true`
8. `onLogin(user)` fires — identify + track `user_login` event (with or without common properties)

On a page refresh, there's no `logged_in` param, so no login event fires.

### Logout

`onLogout(user)` is called in `AuthContext.signOut()` before the sign-out fetch. It fires a `user_logout` track event (with the obfuscated userId), then calls `analyticsService.reset()` to clear the Segment identity.

---

## Condition System Integration

Analytics registers an `isAnalyticsEnabled` condition that integrates with the feature flags system:

```ts
// In a React component — check if analytics is available
import { useIsAnalyticsEnabled } from '~/analytics/conditional-checks';

const MyComponent = () => {
  const { isAnalyticsEnabled } = useIsAnalyticsEnabled();

  return isAnalyticsEnabled ? <AnalyticsPanel /> : null;
};
```

### Using as a Feature Flag Guard

```ts
// In src/feature-flags/flags.ts
'my-analytics-feature': {
  key: 'my-analytics-feature',
  description: 'Feature that requires analytics',
  defaultEnabled: false,
  status: 'wip',
  guard: {
    allOf: ['isAnalyticsEnabled'],
    failureReason: 'Analytics is not available',
    visibleInFeatureFlagPanel: true,
  },
},
```

The condition awaits the deferred `whenAnalyticsReady()` promise, so it always returns the correct value regardless of initialization timing.

---

## Adding New Events

### Step 1: Define the event in the schema

New events must be defined in the [segment-bridge schema](https://github.com/konflux-ci/segment-bridge/tree/main/schema). After the schema PR merges, update the pinned commit and regenerate types:

```bash
yarn generate:analytics-types
```

This generates the event type, adds it to `TrackEvents`, and creates the `EventPropertiesMap` entry automatically.

### Step 2: Track in a component

```ts
import { analyticsService } from '~/analytics/AnalyticsService';
import { TrackEvents } from '~/analytics';
import { obfuscate } from '~/analytics/obfuscate';

const handleSubmit = async () => {
  const userId = await obfuscate(username);
  analyticsService.track(TrackEvents.feedback_submitted_event, {
    userId,
    rating: 5,
    feedback: 'Great!',
  });
};
```

The compiler enforces the correct properties for each event — passing wrong fields or missing required ones is a type error.

### Guidelines

- Event names and schemas are defined in segment-bridge, not in UI code
- PIA fields (userId, email, etc.) must be obfuscated using `obfuscate()` which returns `SHA256Hash`
- Don't track raw PII — all identifying data goes through `obfuscate()`
- Events are no-ops when analytics is disabled — no need to guard with `if` checks
- Use `setCommonProperties()` for `CommonFields` that apply to all events

---

## Local Development

1. Set dummy values in `public/runtime-config.js` (already configured):
   ```js
   window.KONFLUX_RUNTIME.ANALYTICS_ENABLED = 'true';
   window.KONFLUX_RUNTIME.ANALYTICS_WRITE_KEY = 'LOCAL_DEV_DUMMY_KEY';
   window.KONFLUX_RUNTIME.ANALYTICS_API_URL = 'localhost/analytics';
   ```

2. The Segment SDK will attempt to initialize. With dummy keys it won't send real data, but you can verify:
   - `initAnalytics()` runs without errors
   - `getAnalytics()` returns an instance
   - Login/logout events fire at the right times
   - The `isAnalyticsEnabled` condition resolves to `true`

3. Check the browser console for `Analytics loaded` on startup and logger output for login/logout events.

---

## Troubleshooting

### Analytics not initializing

1. Check the browser console for `Error loading Analytics`
2. Verify `/segment/key` and `/segment/url` return `text/plain` responses (not HTML)
3. Check `window.KONFLUX_RUNTIME` values in the console

### Login event not firing

1. Verify the redirect URL contains `?logged_in=1` — check the Network tab for the `/oauth2/sign_in` redirect
2. `consumeLoginSignal()` should strip the param from the URL after consuming it
3. On page refresh, no login event should fire (this is correct behavior)

### Condition always false

1. Check that `initAnalytics()` completed — `await whenAnalyticsReady()` in the console
2. Verify the condition is registered in `src/registers.ts`
3. Check `FeatureFlagsStore.conditions` in the console for the current state


# Analytics Type Generation

The Konflux UI generates TypeScript types from the [segment-bridge analytics schema](https://github.com/konflux-ci/segment-bridge/tree/main/schema) to ensure type-safe Segment event tracking.

## Quick Start

```bash
yarn generate:analytics-types
```

This produces `src/analytics/gen/analytics-types.ts` containing:

- **`CommonFields`** — base interface inherited by every event
- **Per-event types** (e.g. `UserLoginEvent`) — `CommonFields & { ...event-specific fields }`
- **`SHA256Hash`** — branded type for obfuscated PIA fields (prevents passing raw strings)
- **`TrackEvents`** — enum of event names for Segment `track()` calls
- **`KonfluxUISegmentEvents`** — union of all event types

## Schema Pinning

The generator fetches the schema from segment-bridge at a **pinned commit hash** (not `main`) to ensure stable, reproducible builds. The commit is configured in `scripts/generate-analytics-types.mjs`:

```js
const SCHEMA_COMMIT = '<commit-hash>';
```

### Updating the schema version

1. Check the [segment-bridge schema](https://github.com/konflux-ci/segment-bridge/tree/main/schema) for changes
2. Update `SCHEMA_COMMIT` in `scripts/generate-analytics-types.mjs` to the new commit hash
3. Run `yarn generate:analytics-types`
4. Verify the generated types and commit

## Usage

```ts
import { TrackEvents, UserLoginEvent, SHA256Hash } from '../analytics/gen/analytics-types';
import { obfuscate } from '../analytics/obfuscate';

// obfuscate() returns SHA256Hash — required by PIA fields
const hashedUserId: SHA256Hash = await obfuscate(rawUserId);

const event: UserLoginEvent = {
  userId: hashedUserId,
  clusterVersion: '1.30',
  konfluxVersion: '1.2.3',
  kubernetesVersion: '1.30',
};

analytics.track(TrackEvents.user_login_event, event);
```

## Obfuscation

Fields marked as PIA in the schema are typed as `SHA256Hash` — a branded string type. Raw strings cannot be assigned to these fields. Use the `obfuscate()` utility (`src/analytics/obfuscate.ts`) which hashes via the Web Crypto API and returns `SHA256Hash`.

## Local Development

During development, if the remote schema URL is unreachable, the generator falls back to a local clone of segment-bridge at `../segment-bridge/schema/ui.json` (relative to the konflux-ui repo root). So make sure the segment-bridge is cloned on your local.
