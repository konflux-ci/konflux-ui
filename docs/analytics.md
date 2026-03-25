# Analytics (Segment) Integration

Konflux UI uses [Segment](https://segment.com/) (Analytics.js 2.0) for product analytics. Segment routes events to downstream destinations (Amplitude, Mixpanel, BigQuery, etc.) configured in the Segment dashboard.

---

## Architecture

```
main.tsx
  └── initAnalytics()                        # SDK init (non-blocking, code-split)
        └── loadAnalyticsConfig()             # Config resolution
              ├── fetch /segment/key + /segment/url   # Production
              └── window.KONFLUX_RUNTIME              # Local dev fallback

App (main.tsx)                                 # Renders after auth
  ├── useKonfluxPublicInfo()                   # Fetch version data from ConfigMap
  ├── analyticsService.setCommonProperties()   # Set CommonFields if available
  └── consumeLoginSignal() → onLogin()         # Login event on real OAuth login

AuthContext.tsx
  └── onLogout()                               # Logout event on sign out

Components
  └── useTrackAnalyticsEvent()                 # Type-safe track hook
```

### Key files

| File | Purpose |
|------|---------|
| `src/analytics/index.ts` | SDK init, `getAnalytics()`, `whenAnalyticsReady()`, re-exports generated types |
| `src/analytics/AnalyticsService.ts` | Service singleton — `track()`, `page()`, `identify()`, `reset()` |
| `src/analytics/hooks.ts` | `useTrackAnalyticsEvent` hook |
| `src/analytics/gen/analytics-types.ts` | Auto-generated types from segment-bridge schema |
| `src/analytics/obfuscate.ts` | SHA-256 hashing for PIA fields (`SHA256Hash` branded type) |
| `src/analytics/load-config.ts` | Config resolution (API-first, runtime fallback) |
| `src/analytics/conditional-checks.ts` | `isAnalyticsEnabled` condition + `useIsAnalyticsEnabled` hook |
| `src/auth/useAuthAnalytics.ts` | `useAuthAnalytics` hook — `onLogin` / `onLogout` callbacks |

---

## Configuration

### Production / Staging

Two backend endpoints provide the Segment config:

- `GET /segment/key` — write key (`text/plain`)
- `GET /segment/url` — API host (`text/plain`)

### Local Development

Set values in `public/runtime-config.js`:

```js
window.KONFLUX_RUNTIME.ANALYTICS_ENABLED = 'true';
window.KONFLUX_RUNTIME.ANALYTICS_WRITE_KEY = 'LOCAL_DEV_DUMMY_KEY';
window.KONFLUX_RUNTIME.ANALYTICS_API_URL = 'localhost/analytics';
```

With dummy keys the SDK initializes but won't send real data. Verify in the console: `Analytics loaded` on startup, logger output for login/logout.

### Resolution order

1. Fetch `/segment/key` + `/segment/url` (must be `text/plain`, non-empty key)
2. Fall back to `window.KONFLUX_RUNTIME.ANALYTICS_*`
3. If disabled or missing — SDK is not loaded, all calls become no-ops

---

## Initialization

Analytics initializes in `main.tsx` alongside monitoring via `Promise.allSettled()`. It is **non-blocking** (app renders immediately), **code-split** (SDK loaded only when enabled), and **failure-safe** (errors are logged, app continues).

`whenAnalyticsReady()` returns a promise that resolves to `true`/`false` once init settles. The conditions system awaits this to avoid race conditions.

---

## AnalyticsService

The `AnalyticsService` singleton is the primary interface for tracking.

```ts
import { analyticsService } from '~/analytics/AnalyticsService';
import { TrackEvents } from '~/analytics';
import { obfuscate } from '~/analytics/obfuscate';

// Common properties — merged into every track() and page() call
analyticsService.setCommonProperties({
  clusterVersion: '4.14',
  konfluxVersion: '1.2.3',
  kubernetesVersion: '1.30',
});

// Type-safe tracking — compiler enforces correct payload per event
const userId = await obfuscate(rawUsername);
analyticsService.track(TrackEvents.feedback_submitted_event, {
  userId, rating: 5, feedback: 'Great experience',
});

// Page view
analyticsService.page('Application Details', { app_id: '123' });

// Identity (called automatically by useAuthAnalytics)
analyticsService.identify(userId);
analyticsService.reset();
```

### Type-safe `track()`

```ts
track<E extends TrackEvents>(event: E, properties: EventPropertiesMap[E]): void
```

Each `TrackEvents` value maps to event-specific properties (minus `CommonFields`, which are merged automatically from `setCommonProperties()`). Wrong fields or missing required ones are compile-time errors.

### Common properties

`setCommonProperties(Partial<CommonFields>)` sets base fields (cluster version, Konflux version, etc.) that are merged into every `track()` and `page()` call. These are set in the `App` component from `useKonfluxPublicInfo()` data after authentication.

---

## Login / Logout Events

### Login detection

The challenge is distinguishing a real OAuth login from a page refresh (both call `/oauth2/userinfo`). The solution uses a URL query parameter:

1. `/oauth2/userinfo` returns 401 → redirect to `/oauth2/sign_in?rd=/path?logged_in=1`
2. After OAuth, user is redirected back with `?logged_in=1`
3. `AuthProvider` confirms auth → renders `App`
4. `App` waits for `useKonfluxPublicInfo()` to settle (loaded or error)
5. Sets common properties if version fields are present in the ConfigMap
6. `consumeLoginSignal()` detects and strips the `logged_in` param → `onLogin(user)` fires

On a page refresh there is no `logged_in` param, so no login event fires.

### Logout

`onLogout(user)` is called in `AuthContext.signOut()` before the sign-out fetch. It tracks a `user_logout` event, then calls `analyticsService.reset()` to clear the Segment identity.

---

## Condition System Integration

Analytics registers an `isAnalyticsEnabled` condition for the feature flags system:

```ts
const { isAnalyticsEnabled } = useIsAnalyticsEnabled();
```

This can guard features that require analytics:

```ts
guard: { allOf: ['isAnalyticsEnabled'] }
```

The condition awaits `whenAnalyticsReady()`, so it returns the correct value regardless of initialization timing.

---

## Adding New Events

### 1. Define in schema

New events are defined in the [segment-bridge schema](https://github.com/konflux-ci/segment-bridge/tree/main/schema). After the schema PR merges, regenerate types:

```bash
yarn generate:analytics-types
```

This produces `src/analytics/gen/analytics-types.ts` with the event type, `TrackEvents` enum entry, and `EventPropertiesMap` mapping.

### 2. Track in a component

```ts
import { useTrackAnalyticsEvent } from '~/analytics/hooks';
import { TrackEvents } from '~/analytics';
import { obfuscate } from '~/analytics/obfuscate';

const trackEvent = useTrackAnalyticsEvent();

const handleSubmit = async () => {
  const userId = await obfuscate(username);
  trackEvent(TrackEvents.feedback_submitted_event, {
    userId, rating: 5, feedback: 'Great!',
  });
};
```

### Guidelines

- Event schemas live in segment-bridge, not in UI code
- PIA fields must be obfuscated via `obfuscate()` (returns `SHA256Hash` branded type — raw strings cannot be assigned)
- Events are no-ops when analytics is disabled — no `if` guards needed
- Use `setCommonProperties()` for fields that apply to all events

---

## Type Generation

Types are generated from the [segment-bridge analytics schema](https://github.com/konflux-ci/segment-bridge/tree/main/schema) using `json-schema-to-typescript`.

### Generated output

`src/analytics/gen/analytics-types.ts` contains:

- `CommonFields` — base interface for every event
- Per-event types (e.g. `UserLoginEvent`) — `CommonFields & { ...event-specific fields }`
- `SHA256Hash` — branded type for obfuscated PIA fields
- `TrackEvents` — enum of event names
- `EventPropertiesMap` — maps each `TrackEvents` value to its event-specific properties

### Schema pinning

The generator fetches from a **pinned commit hash** (not `main`) for reproducible builds. Update the hash in `scripts/generate-analytics-types.mjs`:

```js
const SCHEMA_COMMIT = '<commit-hash>';
```

To update: change the hash → `yarn generate:analytics-types` → verify → commit.

If the remote URL is unreachable, the generator falls back to a local clone at `../segment-bridge/schema/ui.json`.

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Analytics not initializing | Console for `Error loading Analytics`; verify `/segment/key` and `/segment/url` return `text/plain` (not HTML); check `window.KONFLUX_RUNTIME` values |
| Login event not firing | Network tab: redirect URL should contain `?logged_in=1`; `consumeLoginSignal()` strips it after first call; no event on page refresh is correct |
| Condition always false | `await whenAnalyticsReady()` in console; verify condition registered in `src/registers.ts`; check `FeatureFlagsStore.conditions` |
