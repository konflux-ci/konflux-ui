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
  ├── analyticsService.setCommonProperties()   # Set CommonFields when available
  ├── analyticsService.identify()              # Transport-level pseudonymous userId
  └── consumeLoginSignal() → onLogin()         # Login event on real OAuth login

AuthContext.tsx
  └── onLogout()                               # Logout event on sign out

Components
  └── useTrackAnalyticsEvent()                 # Type-safe track hook
```

### Key files

| File | Purpose |
|------|---------|
| `src/analytics/index.ts` | SDK init, Segment transport configuration, lifecycle listeners, `getAnalytics()`, `whenAnalyticsReady()`, re-exports generated types |
| `src/analytics/AnalyticsService.ts` | Typed tracking, common fields, and session identity — `track()`, `identify()`, `reset()` |
| `src/analytics/hooks.ts` | `useTrackAnalyticsEvent` and `useJourneyTracker` hooks |
| `src/analytics/JourneyCollector.ts` | Journey accumulation and flushing |
| `src/analytics/gen/analytics-types.ts` | Auto-generated types from segment-bridge schema |
| `src/analytics/obfuscate.ts` | SHA-256 hashing for PIA fields (`SHA256Hash` branded type) |
| `src/routes/with-route-patterns.ts` | Stamps each route's privacy-safe pattern (e.g. `/ns/:workspaceName/applications`) onto `handle.routePattern`; `getRoutePatternFromMatches()` reads it back via `useMatches()` |
| `src/analytics/load-config.ts` | Config resolution (API-first, runtime fallback) |
| `src/analytics/conditional-checks.ts` | `isAnalyticsEnabled` condition + `useIsAnalyticsEnabled` hook |
| `src/analytics/arrival-source.ts` | Classifies `document.referrer` into an `ArrivalSource` and persists it across the OAuth redirect |
| `src/auth/useAuthAnalytics.ts` | `useAuthAnalytics` hook — `onLogin` / `onLogout` callbacks |
| `src/feature-flags/useFeatureFlagAnalytics.ts` | Hook fired from `Panel.tsx` — diffs flag state on panel open vs. close and tracks `feature_flags_changed` |

---

## Configuration

### Production / Staging

Two backend endpoints provide the Segment config:

- `GET /segment/key` — write key (`text/plain`)
- `GET /segment/url` — API host and path (`text/plain`), without scheme (for example `api.segment.io/v1`)

`initAnalytics()` preserves that path when configuring the Segment SDK as `apiHost`; the SDK posts to `https://${apiHost}/t`.

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

Analytics initializes in `main.tsx`. It is **non-blocking** (app renders immediately), **code-split** (SDK loaded only when enabled), and **failure-safe** (errors are logged, app continues).

`whenAnalyticsReady()` returns a promise that resolves to `true`/`false` once init settles. The conditions system awaits this to avoid race conditions.

Segment client persistence is disabled (`disableClientPersistence: true`). `AnalyticsService` generates an in-memory `sessionId` per tab, installs it as Segment's transport-level `anonymousId`, and rotates it on logout.

---

## AnalyticsService

The `AnalyticsService` singleton is the primary interface for tracking.

```ts
import { analyticsService } from '~/analytics/AnalyticsService';
import { TrackEvents } from '~/analytics';

analyticsService.setCommonProperties({
  clusterVersion: '4.14',
  konfluxVersion: '1.2.3',
  kubernetesVersion: '1.30',
});

analyticsService.track(TrackEvents.feedback_submitted_event, {
  rating: 5,
  feedback: 'Great experience',
});
```

### Type-safe `track()`

```ts
track<E extends TrackEvents>(
  event: E,
  properties: Omit<EventPropertiesMap[E], 'userId'>,
): boolean
```

`EventPropertiesMap` excludes common fields and `userId` from call-site payloads; `AnalyticsService.track()` merges both automatically after `identify()`. The call returns `false` when analytics is unavailable or required common fields are missing.

### Common properties and version gating

`setCommonProperties()` receives version metadata from `useKonfluxPublicInfo()`. Events are withheld until `clusterVersion`, `konfluxVersion`, and `kubernetesVersion` are available so every emitted payload satisfies the schema. `konflux-public-info` does not emit `clusterVersion`; the app falls back to `openshiftVersion`, then `kubernetesVersion`.

### Identity and privacy

After authentication, `main.tsx` derives a stable, cluster-scoped pseudonymous `userId` by SHA-256 hashing `preferredUsername:clusterId` and sends it through Segment's transport-level `identify()` API. The raw username and `clusterId` must not appear in event payloads.

A refresh has a new `sessionId` but the same `userId`; a second tab has its own `sessionId` and the same `userId`. The hash is pseudonymous, not anonymous.

Journeys use route patterns such as `/ns/:workspaceName/applications`; unmatched routes use `/unknown`, never the raw pathname.

---

## Login / Logout Events

### Login detection

The challenge is distinguishing a real OAuth login from a page refresh (both call `/oauth2/userinfo`). The solution uses a URL query parameter:

1. `/oauth2/userinfo` returns 401 → redirect to `/oauth2/sign_in?rd=/path?logged_in=1`
2. After OAuth, user is redirected back with `?logged_in=1`
3. `AuthProvider` confirms auth → renders `App`
4. `App` waits for `useKonfluxPublicInfo()` to settle
5. Sets common properties and calls `analyticsService.identify()` when authenticated
6. `consumeLoginSignal()` detects and strips the `logged_in` param → `onLogin()` fires

On a page refresh there is no `logged_in` param, so no login event fires. Login and logout pass empty objects to `track()`; identity is carried at the transport layer.

### Logout

`AuthContext.signOut()` is immediately followed by a synchronous redirect to the login page (`redirectToLogin()` / `window.location.replace`). Because Segment's `analytics.track()` is async, firing it and navigating away in the same tick risks the browser tearing the page down before the request is ever dispatched, silently dropping the event.

To avoid this, `signOut()` `await`s `onLogout()` before doing the sign-out fetch and redirect. `onLogout()` sends the `user_logout` event via `AnalyticsService.trackAndWait()` and force-flushes the current journey via `JourneyCollector.flushAndWait()`. These await the Segment SDK dispatch/queue operation, not a durable storage acknowledgement from Segment. Both are wrapped in a short timeout (`LOGOUT_FLUSH_TIMEOUT_MS`, 2s) so a stalled network never blocks logout indefinitely. Once that settles (or times out), `onLogout()` resets the collector and calls `analyticsService.reset()` to rotate the session ID and clear the transport identity.

---

## User journey telemetry

`user_journey` captures ordered route patterns and dwell time in `steps`:

- `pagePattern`: the current privacy-safe route pattern
- `toPagePattern`: the next route pattern, absent on the open step
- `durationMs`: elapsed time on the step

`useJourneyTracker()` records route changes through the shared `JourneyCollector`. Checkpoints are non-destructive: later flushes may repeat steps with longer durations or a newly known `toPagePattern`.

Journeys flush on:

- logout through `JourneyCollector.flushAndWait()`, awaited before navigation, forced past checkpoint deduplication (see [Logout](#logout))
- payload splitting, before a journey exceeds the downstream destination's property limit

Flushes return `false`/resolve `false` when there are no steps or required common fields are missing.

Background-tab and browser-close delivery are deliberately out of scope until a supported, end-to-end tested lifecycle transport is available.

### Payload splitting

When closed steps exceed the 80 KB estimate, the collector flushes a part and starts another without duplicating the boundary step. Split parts keep `sessionStartedAt` and `journeyId` stable, increment `journeyPartIndex`, and use an independent duration clock. `journeyId` and `journeyPartIndex` are omitted until a split occurs to avoid adding bytes to normal sessions.

### Downstream queries

Checkpoint events overlap. Do not sum all `durationMs` values for a session. Group by `sessionStartedAt` and select the latest event. For split journeys, select the latest event per `journeyPartIndex`, group parts by `journeyId`, then concatenate parts in index order.

Queries must use `steps.pagePattern` and `steps.toPagePattern`; the old `steps.path` and `steps.toPath` names are no longer emitted.

---

## Arrival Source

`captureArrivalSourceOnce()` runs as the first statement in `main.tsx` to classify `document.referrer` before the OAuth redirect can overwrite it. The classified value is a `GitProvider` (`GITHUB`, `GITLAB`, `BITBUCKET`, or `UNSURE`/`'other'` — see `src/shared/utils/git-utils.tsx`), persisted to `sessionStorage` so it survives the redirect.

`GithubRedirect` refines this further: when a PipelineRun loads, it reads the `git-provider` label and calls `refineArrivalSource()` to upgrade an `UNSURE` value to the real provider — including `FORGEJO`, which has no fixed domain and can't be detected from `document.referrer` alone.

`markSessionStartedOnce()` is a separate guard that ensures the `ui_session_started` event fires exactly **once per new tab** — it returns `true` only the first time it's called per tab session. `sessionStorage` persists across reloads/navigation but is fresh for a new tab, which is what enforces the "new tab only" rule.

```ts
// In the App effect (main.tsx):
if (markSessionStartedOnce()) {
  trackEvent(TrackEvents.ui_session_started_event, { arrivalSource: getArrivalSource() });
}
```

Why two guards:
- `captureArrivalSourceOnce()` dedupes the *referrer capture* (runs at boot, before React).
- `markSessionStartedOnce()` dedupes the *event fire* (runs inside the App effect, after auth/publicInfo settle).

---

## Feature Flag Change Tracking

`useFeatureFlagAnalytics()` in `FeatureFlagPanel` tracks `feature_flags_changed` on every panel close (including `changesCount: 0`), via the modal's `onClose` in `Panel.tsx` — not on unmount.

On open it snapshots flag state (from `useFeatureFlags()`) and `pagePattern` via `useMatches()` + `getRoutePatternFromMatches()` (`src/routes/with-route-patterns.ts`) — e.g. `/ns/:workspaceName/applications`, never the resolved URL. `withRoutePatterns()` stamps the pattern onto every route's `handle` at router creation (`src/routes/index.tsx`), so other route-aware analytics hooks can reuse the same helper. On close, `computeFeatureFlagChanges()` diffs open vs. current state and tracks `changes`, `changesCount`, and `pagePattern`. Net-zero toggles are omitted; "Reset to Defaults" is included. URL param overrides (`?ff_flag=true`) are not tracked.

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

const trackEvent = useTrackAnalyticsEvent();

const handleSubmit = () => {
  trackEvent(TrackEvents.feedback_submitted_event, {
    rating: 5,
    feedback: 'Great!',
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
- `TrackEvents` — enum of event names
- `EventPropertiesMap` — maps each `TrackEvents` value to its event-specific properties

`SHA256Hash` is defined in `src/analytics/obfuscate.ts` and imported by the generated file.

### Schema pinning

The generator fetches from a **pinned commit hash** (not `main`) for reproducible builds. Update the hash in `scripts/generate-analytics-types.mjs`:

```js
const SCHEMA_COMMIT = '<commit-hash>';
```

To update: change the hash → `yarn generate:analytics-types` → verify → commit.

If the remote URL is unreachable, the generator checks supported sibling-checkout paths for `segment-bridge/schema/ui.json`. Set `ANALYTICS_SCHEMA_LOCAL=1` to prefer a local checkout during development.

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Analytics not initializing | Console for `Error loading Analytics`; verify `/segment/key` and `/segment/url` return `text/plain` (not HTML); check `window.KONFLUX_RUNTIME` values |
| Login event not firing | Network tab: redirect URL should contain `?logged_in=1`; `consumeLoginSignal()` strips it after first call; no event on page refresh is correct |
| Condition always false | `await whenAnalyticsReady()` in console; verify condition registered in `src/registers.ts`; check `FeatureFlagsStore.conditions` |
