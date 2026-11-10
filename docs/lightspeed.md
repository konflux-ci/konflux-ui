# Lightspeed & AI Chat Integration

Konflux UI integrates with [OpenShift Lightspeed](https://github.com/openshift/lightspeed-service) for the experimental AI chat assistant. The browser talks to Lightspeed through a same-origin plugin path; feature flags and runtime conditions gate when the chatbot UI is loaded.

---

## Architecture

```
AppRoot
  └── AIChatGate                         # IfFeature("ai-chat")
        └── AIChatDockLoader             # useIsLightspeedAvailable()
              └── lazy AIChatDock        # PatternFly chatbot shell (chunk: ai-chat-dock)

src/registers.ts
  └── registerCondition('isLightspeedAvailable', checkIfLightspeedIsAvailable, TTL)

src/lightspeed/
  ├── lightspeedConfig.ts                # API base path, timeouts, absolute URL helper
  ├── lightspeedClient.ts                # Singleton LightspeedClient
  └── conditional-checks.ts              # Health check → condition + hooks
```

### Key files

| File | Purpose |
|------|---------|
| `src/lightspeed/lightspeedConfig.ts` | `LIGHTSPEED_API_BASE` (`/api/plugins/lightspeed`), health-check timeout (10s), condition TTL (30s), `resolveLightspeedClientBaseUrl()` |
| `src/lightspeed/lightspeedClient.ts` | Lazy singleton wrapping `@redhat-cloud-services/lightspeed-client` |
| `src/lightspeed/conditional-checks.ts` | `checkIfLightspeedIsAvailable`, `useIsLightspeedAvailable`, `isLightspeedAvailable` |
| `src/registers.ts` | Registers `isLightspeedAvailable` with TTL |
| `src/feature-flags/flags.ts` | `ai-chat` flag definition and guards |
| `src/feature-flags/conditions.ts` | `LIGHTSPEED: 'isLightspeedAvailable'` condition key |
| `src/components/AIChat/AIChatGate.tsx` | Feature-flag + availability gate; lazy-loads the dock |
| `src/components/AIChat/AIChatDock.tsx` | PatternFly chatbot UI (toggle + panel), portaled to `document.body` |
| `src/components/AIChat/const.ts` | Display copy, display mode, footnote |
| `src/components/AIChat/AIChat.scss` | Dock / brand styles |
| `src/AppRoot/AppRoot.tsx` | Mounts `<AIChatGate />` at app root |
| `webpack.dev.config.js` | Dev proxy for `/api/plugins/lightspeed` → `LIGHTSPEED_URL` |

---

## Lightspeed client

### Setup

`getLightspeedClient()` creates a single `LightspeedClient` instance on first use:

```ts
import { LightspeedClient } from '@redhat-cloud-services/lightspeed-client';

lightspeedClient = new LightspeedClient({
  baseUrl: resolveLightspeedClientBaseUrl(),
});
```

- **Base URL**: relative path `/api/plugins/lightspeed`, resolved to an absolute URL with `window.location.origin` because `LightspeedClient.buildUrl()` requires an absolute `baseUrl`.
- **Auth**: not configured on the client. Requests are same-origin, so the browser sends session cookies. The webpack proxy (local) or cluster ingress (deployed) forwards credentials to Lightspeed.

### Config constants (`lightspeedConfig.ts`)

| Constant | Value | Role |
|----------|-------|------|
| `LIGHTSPEED_API_BASE` | `/api/plugins/lightspeed` | Browser path prefix for all Lightspeed calls |
| `LIGHTSPEED_HEALTH_CHECK_TIMEOUT_MS` | `10_000` | Abort a stuck health-check request |
| `LIGHTSPEED_CONDITION_TTL_MS` | `30_000` | Cache window for `isLightspeedAvailable` |

### Availability check

`checkIfLightspeedIsAvailable()` calls `getLightspeedClient().healthCheck()` (client combines liveness + readiness). Healthy means:

```ts
health.status === 'healthy' && health.alive && health.ready
```

Any thrown error or abort → `false`. Re-evaluation is driven by the condition TTL in `registers.ts`.

Hooks / helpers:

- `useIsLightspeedAvailable()` — React hook via `createConditionsHook`
- `isLightspeedAvailable` — non-React `ensureConditionIsOn(['isLightspeedAvailable'])`

See [conditions.md](./conditions.md) for the evaluation engine.

---

## Feature flag & gating

### `ai-chat` flag

Defined in `src/feature-flags/flags.ts`:

```ts
'ai-chat': {
  key: 'ai-chat',
  description: 'Enable Konflux AI chat bot',
  defaultEnabled: false,
  status: 'wip',
  guard: {
    allOf: ['isStagingCluster', 'isLightspeedAvailable'],
    failureReason: 'Requires staging environment with Konflux AI available',
    visibleInFeatureFlagPanel: false,
  },
},
```

Both conditions must pass before the flag can be enabled:

1. **`isStagingCluster`** — `konflux-public-info` reports `environment === STAGING`
2. **`isLightspeedAvailable`** — Lightspeed health check succeeds

`visibleInFeatureFlagPanel: false` hides the flag entirely when guards fail (it does not appear disabled in the panel).

### Runtime gate stack

Even when the flag is on, the UI does a second availability check before loading the chatbot bundle:

1. `AIChatGate` wraps children in `<IfFeature flag="ai-chat">`
2. `AIChatDockLoader` calls `useIsLightspeedAvailable()`; if false, renders `null`
3. Only then is the lazy `AIChatDock` chunk imported

This keeps PatternFly chatbot code and CSS out of the main bundle unless both the flag and Lightspeed are available.

---

## AI chat UI layer

### Mount point

`AppRoot` always renders `<AIChatGate />` next to the main page chrome. The gate decides whether anything appears.

### Dock / panel

`AIChatDock` portals a PatternFly chatbot into `document.body`:

- **Toggle** — floating button (`ChatbotToggle`)
- **Panel** — header (Konflux logo), welcome prompt, message bar, footnote
- **Display mode** — `ChatbotDisplayMode.default` (`KONFLUX_AI_DISPLAY_MODE`)

Copy and labels live in `const.ts` (welcome title/description, placeholder, toggle tooltip/aria label, review footnote).

### Client usage today vs. send path

**Current state:** the dock is a UI shell. `MessageBar.onSendMessage` is a no-op (`() => undefined`). The Lightspeed client is used only for the availability health check.

**Intended integration** (when wiring chat): use `getLightspeedClient()` from UI hooks — the client already exposes `init()`, `createNewConversation()`, `sendMessage()`, conversation history APIs, and streaming helpers from `@redhat-cloud-services/lightspeed-client`. Keep chatbot imports behind the existing lazy gate so send/init code stays out of the main chunk.

Suggested ownership when adding send/init:

| Concern | Likely location |
|---------|-----------------|
| Conversation lifecycle (`init` / create) | Hook under `src/components/AIChat/` or `src/lightspeed/` |
| Send + streaming | Same hooks, calling `getLightspeedClient().sendMessage(...)` |
| Message list state | Local state or small store owned by `AIChatDock` |
| UI shell | Stay in `AIChatDock.tsx` |

---

## Request / data flow

```
Browser
  │
  ├─ Condition eval (TTL 30s)
  │    └─ GET  /api/plugins/lightspeed/.../liveness|readiness
  │         └─ (dev) webpack proxy → LIGHTSPEED_URL
  │         └─ (deployed) cluster ingress → Lightspeed plugin
  │
  └─ [future] Chat send / stream
       └─ POST /api/plugins/lightspeed/v1/...  (same-origin + session cookies)
```

| Step | What happens |
|------|----------------|
| 1 | Conditions system evaluates `isStagingCluster` + `isLightspeedAvailable` |
| 2 | If guards pass, `ai-chat` may be enabled (URL `?ff=ai-chat` / `?ff_ai-chat=true`, localStorage, or panel when visible) |
| 3 | `AIChatGate` renders only when the flag is on |
| 4 | Loader re-checks Lightspeed; on success, downloads `ai-chat-dock` chunk |
| 5 | User opens the toggle; panel shows welcome UI (no backend send yet) |

---

## Lazy loading & bundle size

- `AIChatGate` uses `lazyLoad()` with `webpackChunkName: "ai-chat-dock"`.
- `@patternfly/chatbot` JS/CSS are imported only inside `AIChatDock.tsx`, so they load with that async chunk — not with `main` / `vendor` unless the gate opens the import.
- Fallback while loading is an empty fragment (`fallback={<></>}`) so a spinner does not flash in the chrome.
- Production sizes are enforced by [bundle-size-budgets.md](./bundle-size-budgets.md) / `.size-limit.json`. Prefer keeping chatbot and any future Lightspeed send helpers inside the lazy chunk; avoid importing `@patternfly/chatbot` or heavy client usage from always-mounted modules (`AppRoot`, flag panel, etc.).

---

## Environment & local development

### Cluster / env requirements

| Requirement | Why |
|-------------|-----|
| Staging environment | `ai-chat` guard requires `isStagingCluster` |
| Lightspeed available on the cluster | Health check must return healthy / alive / ready |
| Session auth | Same-origin cookies must reach the Lightspeed plugin path |

On non-staging clusters, or when Lightspeed is down, the flag stays unavailable and the dock never mounts.

### Run Lightspeed locally

To run the Konflux AI agent backend locally (instead of proxying to a remote staging host), use [konflux-ci/konflux-lightspeed](https://github.com/konflux-ci/konflux-lightspeed). That repo provides Kustomize manifests and a `local/` podman-compose setup for lightspeed-stack. Follow its Local Development docs, then point `LIGHTSPEED_URL` at the local service when starting konflux-ui.

### Enable & test locally

1. **Proxy Lightspeed** — set in `.env` (loaded by webpack via dotenvx):

   ```bash
   LIGHTSPEED_URL=https://<staging-or-lightspeed-host>/
   # or a local konflux-lightspeed stack, e.g.:
   # LIGHTSPEED_URL=http://localhost:<port>/
   ```

   `webpack.dev.config.js` proxies `/api/plugins/lightspeed` to that target and strips the `/api/plugins/lightspeed` prefix.

2. **Point the rest of the app at staging** (or a cluster that reports staging + has Lightspeed) via the usual `PROXY_URL` / `AUTH_URL` / `PROXY_WEBSOCKET_URL` values — see [README.md](../README.md).

3. **Start the app** — `yarn start`.

4. **Turn on the flag** when guards pass:

   ```
   ?ff=ai-chat
   ```

   or `?ff_ai-chat=true`. Because `visibleInFeatureFlagPanel` is `false` when guards fail, URL enablement only works after staging + Lightspeed conditions succeed.

5. **Verify**:
   - Network: health requests under `/api/plugins/lightspeed` succeed
   - UI: Konflux AI assistant toggle appears; opening it shows the welcome panel
   - With Lightspeed unavailable: gate renders nothing even if you try to force the flag

### Quick troubleshooting

| Symptom | Check |
|---------|-------|
| No toggle | Flag off; or `isStagingCluster` / `isLightspeedAvailable` false; or health check timing out |
| Flag never appears in panel | Expected when guards fail (`visibleInFeatureFlagPanel: false`) |
| Health always false locally | `LIGHTSPEED_URL` set and reachable; proxy path rewrite; cookies / auth against staging |
| Chat UI loads but send does nothing | Current shell behavior — send/init not wired yet |

---

## Related docs

- [conditions.md](./conditions.md) — condition registration, TTL, hooks
- [feature-flags.md](./feature-flags.md) — flag persistence and URL grammar
- [bundle-size-budgets.md](./bundle-size-budgets.md) — size-limit budgets for async chunks
- [konflux-ci/konflux-lightspeed](https://github.com/konflux-ci/konflux-lightspeed) — local / cluster Lightspeed backend deployment
