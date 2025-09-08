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
// ✅ Flag is enabled AND Kubearchive is installed
// ❌ Flag switch is disabled if Kubearchive isn't installed (user can't enable it)
```

### Two main use cases:

1. **Guarded feature flags**: Prevent users from enabling flags when conditions aren't met
2. **Independent conditions**: Show/hide UI based on runtime conditions without involving feature flags

| Use Case | When to Use | Example |
|----------|-------------|---------|
| **Guarded Flags** | Feature depends on external service/environment | Kubearchive integration only works if Kubearchive is installed |
| **Independent Conditions** | UI needs to adapt to environment without feature flags | Show "staging environment" banner, hide unavailable features |

### Already available conditions

```ts
// These are already set up for you:
'isKubearchiveEnabled' // → true if Kubearchive service is available
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
      allOf: ['isKubearchiveEnabled'],  // Requires Kubearchive
      failureReason: 'Kubearchive must be installed',
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

**That's it!** The flag will automatically be `false` if Kubearchive isn't available, and users won't be able to enable it in the dev panel (the switch will be disabled).

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
    description: 'Kubearchive features',
    defaultEnabled: false,
    status: 'wip',
    guard: {
      allOf: ['isKubearchiveEnabled'], 
      failureReason: 'Kubearchive not installed',
      visibleInFeatureFlagPanel: true,
    },
  },
};

// In component - use flag normally
const MyPage = () => {
  const showKubearchive = useIsOnFeatureFlag('kubearchive-integration');
  // ✅ true only if flag is ON and Kubearchive is available
  // ❌ false if Kubearchive isn't available (user can't enable flag)
  
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
        <div>Kubearchive features unavailable</div>
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
  failureReason: 'Requires staging environment with Kubearchive',
  visibleInFeatureFlagPanel: true,
}
```

### Service dependency features  

```ts
// Feature needs Kubearchive service
guard: {
  allOf: ['isKubearchiveEnabled'],
  failureReason: 'Kubearchive service not available',
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
        <div>Archive features unavailable - Kubearchive not installed</div>
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

### Available conditions:
- `'isKubearchiveEnabled'` - Kubearchive service available
- `'isStagingCluster'` - Running in staging environment

That's it! You now know everything you need to use conditions
