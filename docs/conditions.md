# 🔍 Conditions System — Developer Guide

 The **conditions system** lets you create feature flags that automatically control themselves based on runtime conditions like environment, service availability, or user state. Think "smart feature flags."

---

## Quick Start

### What you need to know

**Conditions control the feature flag switch itself** - if a condition fails, users can't enable the flag in the dev panel (the switch becomes disabled).

```ts
// Old way: Manual checks in your code
const showKubearchive = useIsOnFeatureFlag('kubearchive-integration') && isKubearchiveInstalled;

// New way: Condition-guarded flag
const showKubearchive = useIsOnFeatureFlag('kubearchive-integration'); 
// ✅ Flag is enabled AND KubeArchive is installed
// ❌ Flag switch is disabled if KubeArchive isn't installed (user can't enable it)
```

### Three main use cases:

1. **Guarded feature flags**: Prevent users from enabling flags when conditions aren't met
2. **Independent conditions**: Show/hide UI based on runtime conditions without involving feature flags
3. **Route guards**: Block navigation to stable pages when a required service is unavailable (503 → `ServiceUnavailablePage`)

| Use Case | When to Use | Example |
|----------|-------------|---------|
| **Guarded Flags** | Feature depends on external service/environment | KubeArchive integration only works if KubeArchive is installed |
| **Independent Conditions** | UI needs to adapt to environment without feature flags | Show "staging environment" banner, hide unavailable features |
| **Route Guards** | Stable page requires a cluster service | Issues page requires Kite (`ensureConditionOnLoader`) |

### Already available conditions

```ts
// These are already set up for you:
'isKubearchiveEnabled' // → true if KubeArchive service is available
'isKiteServiceEnabled' // → true if Kite plugin health check passes
'isStagingCluster'     // → true if running in staging environment
```

---

## How to Use Conditions with Feature Flags

### Step 1: Add a "guard" to your feature flag

In `src/feature-flags/flags.ts`:

```ts
export const FLAGS = {
  'my-new-feature': {
    key: 'my-new-feature',
    description: 'My awesome new feature',
    defaultEnabled: false,
    status: 'wip',
    guard: {
      allOf: ['isKubearchiveEnabled'],  // Requires KubeArchive
      failureReason: 'KubeArchive must be installed',
      visibleInFeatureFlagPanel: true,  // when guard fails, show the flag entry disabled with the reason
      // visibleInFeatureFlagPanel: true => show the flag disabled with its reason
      // visibleInFeatureFlagPanel: false => hide the flag entirely when guard conditions aren’t met
    },
  },
} satisfies Record<string, FeatureMeta>;
```

### Step 2: Use the flag normally

```tsx
// In your React component - no changes needed!
const MyComponent = () => {
  const showFeature = useIsOnFeatureFlag('my-new-feature');
  
  return (
    <div>
      {showFeature && <NewFeatureComponent />}
    </div>
  );
};
```

**That's it!** The flag will automatically be `false` if KubeArchive isn't available, and users won't be able to enable it in the dev panel (the switch will be disabled).

### Guard Options

```ts
guard: {
  allOf: ['condition1', 'condition2'],  // ALL must be true (AND logic)
  anyOf: ['condition3', 'condition4'],  // ANY can be true (OR logic)  
  failureReason: 'Shown to users when disabled',
  visibleInFeatureFlagPanel: true,  // Show condition status in dev panel
}
```

---

## Guarded Flags vs Independent Conditions

### Guarded Feature Flag (Controls the switch)

```ts
// src/feature-flags/flags.ts - Add guard to flag
export const FLAGS = {
  'kubearchive-integration': {
    key: 'kubearchive-integration',
    description: 'KubeArchive features',
    defaultEnabled: false,
    status: 'wip',
    guard: {
      allOf: ['isKubearchiveEnabled'], 
      failureReason: 'KubeArchive not installed',
      visibleInFeatureFlagPanel: true,
    },
  },
};

// In component - use flag normally
const MyPage = () => {
  const showKubearchive = useIsOnFeatureFlag('kubearchive-integration');
  // ✅ true only if flag is ON and KubeArchive is available
  // ❌ false if KubeArchive isn't available (user can't enable flag)
  
  return <div>{showKubearchive && <KubearchivePage />}</div>;
};
```

### Independent Condition (Direct UI control)

```ts
// In component - use condition hook directly
const useKubearchive = createConditionsHook(['isKubearchiveEnabled']);

const MyPage = () => {
  const conditions = useKubearchive();
  
  // Always shows appropriate UI based on service availability
  return (
    <div>
      {conditions.isKubearchiveEnabled ? (
        <KubearchivePage />
      ) : (
        <div>KubeArchive features unavailable</div>
      )}
    </div>
  );
};
```

**Key difference**: Guarded flags prevent users from enabling the flag when conditions aren't met. Independent conditions let you adapt UI directly to runtime state.

---

## Common Examples

### Environment-specific features

```ts
// Only show in staging
guard: {
  anyOf: ['isStagingCluster'],
  failureReason: 'Only available in staging',
  visibleInFeatureFlagPanel: true,
}

// Need both staging AND kubearchive
guard: {
  allOf: ['isStagingCluster', 'isKubearchiveEnabled'],
  failureReason: 'Requires staging environment with KubeArchive',
  visibleInFeatureFlagPanel: true,
}
```

### Service dependency features  

```ts
// Feature needs KubeArchive service
guard: {
  allOf: ['isKubearchiveEnabled'],
  failureReason: 'KubeArchive service not available',
  visibleInFeatureFlagPanel: true,
}
```

---

## Creating Your Own Conditions

Need a custom condition? Add it to `src/registers.ts`:

### Simple condition

```ts
// In src/registers.ts
registerCondition('myCustomCheck', async () => {
  // Your logic here - must return true/false
  const response = await fetch('/api/my-service/health');
  return response.ok;
});
```

### Condition with caching

```ts
// Cache result for 5 minutes to avoid repeated API calls
registerCondition('expensiveCheck', async () => {
  const data = await fetch('/api/expensive-operation').then(r => r.json());
  return data.isEnabled;
}, 300000); // 5 minutes in milliseconds
```

### Context-aware condition

```ts
// Can receive context data
registerCondition('hasPermission', async (context?: { user: User, action: string }) => {
  if (!context) return false;
  return checkUserPermission(context.user, context.action);
});
```

---

## Using Conditions Independently in React Components

Sometimes you need to show/hide UI based on conditions **without** involving feature flags. Use `createConditionsHook`:

```ts
import { createConditionsHook } from '~/feature-flags/hooks';

// Create a custom hook for your conditions (independent of feature flags)
const useEnvironmentConditions = createConditionsHook(['isKubearchiveEnabled', 'isStagingCluster']);

const MyComponent = () => {
  const conditions = useEnvironmentConditions();
  
  return (
    <div>
      {/* Show staging banner regardless of any feature flag */}
      {conditions.isStagingCluster && <div>🚧 Staging Environment</div>}
      
      {/* Show archive section only if service is available */}
      {conditions.isKubearchiveEnabled ? (
        <ArchiveSection />
      ) : (
        <div>Archive features unavailable - KubeArchive not installed</div>
      )}
      
      <RegularContent />
    </div>
  );
};
```

**Use this when:**
- You need to conditionally render UI based on environment/service availability
- The condition logic is separate from any feature flag
- You want to show different content based on what's available in the cluster

### For All Flag Conditions

There's a pre-made hook for all conditions used by feature flags:

```ts
import { useAllFlagsConditions } from '~/feature-flags/hooks';

const MyComponent = () => {
  const allConditions = useAllFlagsConditions();
  
  // Has all conditions that any feature flag uses
  console.log(allConditions.isKubearchiveEnabled);
  console.log(allConditions.isStagingCluster);
  
  return <div>...</div>;
};
```

### Benefits of Using Hooks

✅ **Automatic re-renders** when conditions change  
✅ **Proper React lifecycle** - no manual useEffect needed  
✅ **Cached results** - won't re-fetch on every render  
✅ **TypeScript support** - knows which conditions you asked for  
✅ **Subscription cleanup** - handles unsubscribe automatically

---

## Imperative Condition Checks with `ensureConditionIsOn`

React hooks (`createConditionsHook`) are the right tool inside components. For **non-React imperative code** — data hooks, fetch helpers, utility modules — use `ensureConditionIsOn` from `src/feature-flags/utils.ts`.

It returns a **predicate function** that checks whether every listed condition is currently `true` in `FeatureFlagsStore.conditions`. It does **not** throw; the caller decides how to handle a `false` result.

```ts
import { ensureConditionIsOn } from '~/feature-flags/utils';

// Factory: call the returned function when you need the current snapshot
export const isKiteServiceEnabled = ensureConditionIsOn(['isKiteServiceEnabled']);

// Usage in imperative code
if (isKiteServiceEnabled()) {
  await fetchIssues();
}
```

This pattern is used in domain `conditional-checks.ts` modules alongside their React hook counterparts:

```ts
// src/kite/conditional-checks.ts

export const checkIfKiteServiceIsEnabled = async () => {
  const response = await commonFetch('/api/v1/health/', { pathPrefix: 'plugins/kite' });
  return response.ok;
};

// React component — reactive, re-renders when conditions change
export const useIsKiteServiceEnabled = createConditionsHook(['isKiteServiceEnabled']);

// Non-React code — reads the cached snapshot on demand
export const isKiteServiceEnabled = ensureConditionIsOn(['isKiteServiceEnabled']);
```

Conditions referenced by feature-flag guards are evaluated at app startup via `FeatureFlagsStore.ensureConditions(getAllConditionsKeysFromFlags())` in `src/main.tsx`. Independent conditions such as `isKiteServiceEnabled` are evaluated when `useIsKiteServiceEnabled()` mounts or when `FeatureFlagsStore.ensureConditions(['isKiteServiceEnabled'])` is called.

**Multiple conditions (AND logic):**

```ts
const isKiteReady = ensureConditionIsOn(['isKiteServiceEnabled', 'isStagingCluster']);

if (isKiteReady()) {
  // both conditions are true
}
```

---

## Route Guards with `ensureConditionOnLoader`

For **React Router loaders and `lazy()` functions**, use `ensureConditionOnLoader` from `src/feature-flags/utils.ts`. It is a non-hook utility safe to call in loaders.

`ensureConditionOnLoader` is **async** and runs two steps:

1. `await FeatureFlagsStore.ensureConditions(keys)` — evaluate and cache the listed conditions.
2. Check the snapshot via `ensureConditionIsOn(keys)` — if any key is `false` or missing, throw `new Response('Service Unavailable', { status: 503 })`.

React Router renders the route's `errorElement` — `RouteErrorBoundry` shows `ServiceUnavailablePage` for 503 errors.

Use this when a route is stable (not behind a feature flag) but depends on a cluster service such as Kite. For experimental routes, use `ensureFeatureFlagOnLoader` instead (throws **404** — see [feature-flags.md](./feature-flags.md)).

```ts
import { ensureConditionOnLoader } from '~/feature-flags/utils';
import { ISSUES_PATH } from '../paths';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const issuesRoutes = [
  {
    path: ISSUES_PATH.path,
    lazy: async () => {
      await ensureConditionOnLoader(['isKiteServiceEnabled']);
      const { default: Component } = await import('~/components/Issues/Issues');
      return { Component };
    },
    errorElement: <RouteErrorBoundry />,
    children: [/* ... */],
  },
];
```

- Accepts one or more `ConditionKey` values — **all** must be `true` (AND logic, same as `ensureConditionIsOn`).
- Unlike `ensureConditionIsOn`, this utility **evaluates conditions first**, so it is appropriate for route entry where a stale or missing snapshot should block navigation.
- Pair with `<RouteErrorBoundry />` without props — **503** errors render `ServiceUnavailablePage` (page-specific messages come from `condition-messages.ts` based on the URL).

**Compared to `ensureConditionIsOn`:**

| Utility | Context | On failure |
|---------|---------|------------|
| `ensureConditionIsOn` | Imperative code (hooks, fetch helpers) | Returns `false` — caller decides |
| `ensureConditionOnLoader` | Route `loader` / `lazy()` | Throws **503** → `ServiceUnavailablePage` |

---

## Debugging & Troubleshooting

### My condition isn't working

Check the browser dev console - conditions cache their results, so you might need to refresh:

```ts
// In browser console:
window.FeatureFlagsStore.conditions  // See current condition states
```

### Force refresh a condition

```ts
import { invalidateConditions } from '~/feature-flags/conditions';

// Force re-check specific conditions  
invalidateConditions(['isKubearchiveEnabled']);

// Or all conditions
invalidateConditions();
```

### Check if condition is registered

Look in `src/registers.ts` - if your condition isn't there, it will always be `false`.

### My flag is always disabled

1. Check that your condition is returning `true`:
   ```ts
   const conditions = await evaluateConditions(['yourCondition']);
   console.log(conditions.yourCondition); // Should be true
   ```

2. Check your guard logic:
   ```ts
   // This requires BOTH to be true
   allOf: ['condition1', 'condition2']  
   
   // This requires EITHER to be true  
   anyOf: ['condition1', 'condition2']
   ```

---

## Performance Tips

- **Conditions are cached** automatically - don't worry about calling them multiple times
- **Conditions are lazy** - only evaluated when a flag is actually checked
- **API calls are expensive** - set reasonable cache times (5-10 minutes for most service checks)

```ts
// Good: Cache expensive operations with reasonable TTL
registerCondition('serviceHealth', expensiveApiCall, 300000); // 5 min

// Be careful: Without TTL, caches forever (until page refresh)
registerCondition('serviceHealth', expensiveApiCall); // Cached forever!
```

---

## Quick Reference

### Adding condition to feature flag:
```ts
// src/feature-flags/flags.ts
guard: {
  allOf: ['condition1'],  // Must be true
  failureReason: 'User-friendly explanation',
  visibleInFeatureFlagPanel: false, // will be hidden in the FeatureFlag Panel
}
```

### Creating new condition:
```ts  
// src/registers.ts
registerCondition('myCondition', async () => {
  // return true/false
}, cacheTimeMs);
```

### Using conditions in React components:
```ts
import { createConditionsHook } from '~/feature-flags/hooks';

// Independent condition hook (not tied to feature flags)
const useMyConditions = createConditionsHook(['myCondition']);
const conditions = useMyConditions(); // { myCondition: boolean }

// Show different UI based on conditions
{conditions.myCondition ? <AvailableFeature /> : <UnavailableMessage />}
```

### Imperative condition checks (non-React):
```ts
import { ensureConditionIsOn } from '~/feature-flags/utils';

const isKubeArchiveEnabled = ensureConditionIsOn(['isKubearchiveEnabled']);

if (isKubeArchiveEnabled()) {
  // condition snapshot is true
}
```

### Route guards (loaders/lazy):
```ts
import { ensureConditionOnLoader } from '~/feature-flags/utils';

await ensureConditionOnLoader(['isKiteServiceEnabled']);
// errorElement: <RouteErrorBoundry /> → ServiceUnavailablePage on 503
```

### Available conditions:
- `'isKubearchiveEnabled'` — KubeArchive service available
- `'isKiteServiceEnabled'` — Kite plugin health check passes (used by the Issues route)
- `'isStagingCluster'` — Running in staging environment

That's it! You now know everything you need to use conditions
