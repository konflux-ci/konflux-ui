# Analytics (Segment) Integration

Konflux UI uses Segment Analytics.js 2.0 for product analytics. Analytics is code-split, non-blocking, and disabled when configuration is unavailable.

## Configuration

Production and staging read the write key and API host from `GET /segment/key` and `GET /segment/url`. Local development can use:

```js
window.KONFLUX_RUNTIME.ANALYTICS_ENABLED = 'true';
window.KONFLUX_RUNTIME.ANALYTICS_WRITE_KEY = 'LOCAL_DEV_DUMMY_KEY';
window.KONFLUX_RUNTIME.ANALYTICS_API_URL = 'localhost/analytics';
```

The API values take precedence over runtime configuration. Missing or disabled configuration leaves the SDK unloaded and tracking calls become no-ops. `whenAnalyticsReady()` resolves after initialization so feature conditions do not race SDK loading.

Key files:

- `src/analytics/index.ts`: SDK initialization and lifecycle listeners
- `src/analytics/AnalyticsService.ts`: typed tracking, common fields, and session identity
- `src/analytics/JourneyCollector.ts`: journey accumulation and flushing
- `src/routes/route-pattern.ts`: privacy-safe route patterns
- `src/analytics/gen/analytics-types.ts`: generated schema types
- `src/auth/useAuthAnalytics.ts`: login and logout tracking

## Identity, privacy, and common fields

Analytics uses two identifiers. `AnalyticsService` generates an in-memory `sessionId` for each page/tab load, installs it as Segment's transport-level `anonymousId`, and rotates it on logout. After authentication, it derives a stable, cluster-scoped pseudonymous `userId` by SHA-256 hashing `preferredUsername:clusterId` and sends it through Segment's transport-level `identify()` API. This lets downstream analytics link sessions for the same user within a cluster while preserving session-level journey boundaries.

Segment client persistence remains disabled: the pseudonymous identity is never stored in the browser and is recomputed on each authenticated load. A refresh therefore has a new `sessionId` but the same `userId`; a second tab has its own `sessionId` and the same `userId`. `clusterId`, the raw username, resolved URLs, workspace names, resource names, and other identifying values must not be sent. The hash is pseudonymous, not anonymous: `clusterId` is not a secret and usernames may be guessable. A server-side keyed HMAC is required if resistance to that re-identification risk becomes necessary.

Journeys use route patterns such as `/ns/:workspaceName/applications`; unmatched routes use `/unknown`, never the raw pathname.

`setCommonProperties()` receives version metadata from `useKonfluxPublicInfo()`. Events are withheld until `clusterVersion`, `konfluxVersion`, and `kubernetesVersion` are available so every emitted payload satisfies the schema.

```ts
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

`EventPropertiesMap` excludes common fields from call-site payloads. Login and logout pass empty objects. A real login is detected by the one-time `logged_in=1` redirect parameter; refreshes do not emit login events, but they do identify the pseudonymous user so sessions remain linked. Logout flushes the old journey before resetting the collector and clearing the analytics identity.

## User journey telemetry

`user_journey` captures ordered route patterns and dwell time in `steps`:

- `pagePattern`: the current privacy-safe route pattern
- `toPagePattern`: the next route pattern, absent on the open step
- `durationMs`: elapsed time on the step
- `hiddenMs`: time spent hidden, included only when positive

`useJourneyTracker()` records route changes through the shared `JourneyCollector`. Checkpoints are non-destructive: later flushes may repeat steps with longer durations or a newly known `toPagePattern`.

Journeys flush on:

- logout through the normal Segment transport, forced past checkpoint deduplication
- a delayed hidden-tab checkpoint through the normal transport
- `beforeunload` through `navigator.sendBeacon()` as a fallback

SDK and beacon payloads use the same `sessionId`, optional transport-level `userId`, and required version fields. Flushes return `false` when there are no steps or required common fields are missing.

### Payload splitting

When closed steps exceed the 80 KB estimate, the collector flushes a part and starts another without duplicating the boundary step. Split parts keep `sessionStartedAt` and `journeyId` stable, increment `journeyPartIndex`, and use an independent duration clock. `journeyId` and `journeyPartIndex` are omitted until a split occurs to avoid adding bytes to normal sessions.

### Downstream queries

Checkpoint events overlap. Do not sum all `durationMs` values for a session. Group by `sessionStartedAt` and select the latest event. For split journeys, select the latest event per `journeyPartIndex`, group parts by `journeyId`, then concatenate parts in index order.

Queries must use `steps.pagePattern` and `steps.toPagePattern`; the old `steps.path` and `steps.toPath` names are no longer emitted.

## Schema and type generation

Event schemas live in [segment-bridge](https://github.com/konflux-ci/segment-bridge/tree/main/schema), not in UI code. The generator uses a pinned schema commit for reproducibility:

```bash
yarn generate:analytics-types
```

This updates `src/analytics/gen/analytics-types.ts`, including `CommonFields`, event interfaces, `TrackEvents`, and `EventPropertiesMap`. To adopt a schema revision, update `SCHEMA_COMMIT` in `scripts/generate-analytics-types.mjs`, regenerate, verify, and commit both files. When the remote is unavailable, the generator checks supported sibling-checkout paths for `segment-bridge/schema/ui.json`.

When adding an event:

1. Add it to the segment-bridge schema and regenerate types.
2. Track it with `useTrackAnalyticsEvent()` and only its event-specific properties.
3. Add focused coverage for its schema contract or lifecycle behavior.

## Troubleshooting

- Initialization failure: verify `/segment/key` and `/segment/url` return non-empty `text/plain` values, or check `KONFLUX_RUNTIME`.
- Missing login event: verify the OAuth return URL contained `logged_in=1`; no event on refresh is expected.
- Disabled analytics condition: verify `whenAnalyticsReady()` and the condition registration in `src/registers.ts`.
