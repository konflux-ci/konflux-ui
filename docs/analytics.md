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

AuthContext.tsx
  ├── userLogin()   (on real OAuth login)   # identify + login event
  └── userLogout()  (on sign out)           # logout event + reset

Components
  └── analyticsService.track(event, props)  # Custom events (via AnalyticsService)
```

### Key files

| File | Purpose |
|------|---------|
| `src/analytics/index.ts` | SDK initialization, `getAnalytics()`, `whenAnalyticsReady()` |
| `src/analytics/load-config.ts` | Config resolution (API-first, runtime fallback) |
| `src/analytics/AnalyticsService.ts` | Service class for tracking events |
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

// Set properties that are included in every event
analyticsService.setCommonProperties({ cluster: 'prod', environment: 'staging' });

// Track a custom event
analyticsService.track('Button Clicked', { button_name: 'create-app' });

// Track a page view
analyticsService.page('Application Details', { app_id: '123' });

// Identify a user (called automatically on login)
analyticsService.identify(user);

// Login event (called automatically by AuthContext)
analyticsService.userLogin(user);

// Logout event (called automatically by AuthContext)
analyticsService.userLogout();
```

### Common Properties

Properties set via `setCommonProperties()` are merged into every `track` call. Use this for data that applies globally (cluster, environment, etc.).

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
4. `consumeLoginSignal()` detects the `logged_in` param, strips it from the URL, returns `true`
5. `analyticsService.userLogin(user)` fires — only on real logins

On a page refresh, there's no `logged_in` param, so no login event fires.

### Logout

`analyticsService.userLogout()` is called in `signOut()` before the sign-out fetch. This fires the logout event while the user identity is still attached, then calls `analytics.reset()` to clear the Segment identity.

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

### Step 1: Track in a component

```ts
import { analyticsService } from '~/analytics/AnalyticsService';

const handleClick = () => {
  analyticsService.track('Application Created', {
    app_name: name,
    component_count: components.length,
  });
};
```

### Step 2: Track in a hook (existing pattern)

The existing `useTrackEvent` hook in `src/utils/analytics.ts` can also be used from React components. It will be wired to Segment in a future update.

### Guidelines

- Use past-tense event names: `Application Created`, `Button Clicked`, `Pipeline Run Viewed`
- Include relevant context as properties, not in the event name
- Don't track PII beyond username/email (which are handled by `identify`)
- Events are no-ops when analytics is disabled — no need to guard with `if` checks
- Use `setCommonProperties()` for data that applies to all events, not per-event properties

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
