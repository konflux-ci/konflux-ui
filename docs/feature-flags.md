# 🚦 Feature Flagging — Tech Docs

This document explains how our **client‑side** feature‐flag system works, how flags are stored, and how to add or consume a flag in daily development.

---

## 1. What lives where?

```
src/
  feature-flags/
    flags.ts     # canonical list, default states, metadata
    store.ts     # runtime state resolver (localStorage + URL)
    panel.tsx    # React component to disable and enable a feature flag
    hooks.ts     # React hooks and component to disable code
```

*There is **no** backend call. Everything happens in the browser.*

---

## 2. Persistence & update flow

| Step | Source           | Example                              | Notes                                        |
| ---- | ---------------- | ------------------------------------ | -------------------------------------------- |
| 1    | **Default**      | `defaultEnabled` in `flags.ts`       | Baseline value shipped in the bundle.        |
| 2    | **localStorage** | `__ff_overrides__ => { "foo": true }` | Persists your choices across reloads.        |
| 3    | **URL params**   | `?ff=foo,bar` or `?ff_foo=false`    | Highest priority; great for shareable links. |

**Setting a flag with our API does two things:**

1. Writes to localStorage so the change sticks.
2. Patches the current URL (`history.replaceState`) so the address bar shows the new state without a full reload.

---

### URL grammar cheat‑sheet

* `?ff=flagA,flagB` → turn *on* multiple flags quickly.
* `?ff_flagA=true|false` → explicit on/off for one flag.

> The per‑key form (`ff_flag=`) overrides the comma list if both are present.

---

## 3. Adding a new feature flag

1. **Edit `flags.ts`**

   ```ts
   export const FLAGS = {
     kubearchive: {
       key: 'kubearchive',          // must match object key
       description: 'Kubearchive integration',
       defaultEnabled: false,        // off by default in prod
       status: 'wip',                // 'wip' | 'ready'
     },
     // …existing flags
   } as const;
   ```

2. **Gate code paths**

   *React component*

   ```tsx
   import { IfFeature } from '@/feature-flags/react';

   <IfFeature flag="buildServiceAccount">
    <SecretComponent/>
   </IfFeature>
   ```

   *Inside business logic*

   ```tsx
   import { FLAGS } from '~/feature-flags/flags';
   import { useIsOnFeatureFlag } from '@/feature-flags/react';

   const isNew = useIsOnFeatureFlag(FLAGS.buildServiceAccount.key);
   if (isNew) showNew(); else showOld();
   ```

4. **Commit** your changes; reviewers can now enable the flag locally or via URL to test.

---

## 4. Hook & store API

```ts
// read‑only
FeatureFlagsStore.isOn('flag');         // boolean
useIsOnFeatureFlag('flag');             // React hook

// mutate
FeatureFlagsStore.set('flag', true);    // persist + update URL
const [, setFlag] = useFeatureFlags();  // React setter
setFlag('flag', false);

// other helpers
FeatureFlagsStore.resetAll();           // clear LS + URL
FeatureFlagsStore.refresh(search);      // re‑evaluate after router nav
FeatureFlagsStore.subscribe(cb);        // low‑level subscription
```

---

## 5. Routing with feature flags (React Router v6 data router)

You can guard routes at two levels:

- In loaders/lazy (no hooks): stop navigation early and show 404
- In elements (with hooks): hide UI when disabled

### Loader/lazy guard (no hooks)

Use the non-hook utilities from `src/feature-flags/utils.ts`.

```ts
import { ensureFeatureFlagOn, isFeatureFlagOn } from '~/feature-flags/utils';

// Example: gate inside lazy loading
async function lazy() {
  ensureFeatureFlagOnLoader('release-monitor'); // throws 404 if off
  const { ReleaseMonitor } = await import('~/components/ReleaseMonitor');
  return { element: <ReleaseMonitor /> };
}

// Example: gate inside loader
export const loader = () => {
  ensureFeatureFlagOnLoader('release-monitor');
  return null;
};
```

### Environment‑scoped flags

You can scope a flag to specific deployment environments (for example, staging vs. production) using the `environments` field in `flags.ts`.

Define:

```ts
import { KonfluxInstanceEnvironments } from '~/types/konflux-public-info';

export const FLAGS = {
  releaseMonitor: {
    key: 'releaseMonitor',
    description: 'New Release Monitor page',
    defaultEnabled: false,
    status: 'wip',
    environments: [KonfluxInstanceEnvironments.STAGING], // Only available on staging
  },
};
```

Behavior and usage:

- If `environments` is omitted, the flag is available in all environments.
- The Feature Flags panel hides flags that are not allowed in the current environment.
- In UI code (components/elements), you can check environment with `useUIInstance()` if needed.

---

## 6. Cleaning up a finished flag

1. Flip `defaultEnabled: true` and `status: 'ready'` in `flags.ts`.
3. Once verified, Remove obsolete branches, then delete the flag entry.

No stale code, no confusion.

---

Happy flagging! 🎉
