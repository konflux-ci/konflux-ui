import type { FlagKey } from './flags';
import { FeatureFlagsStore } from './store';

type ForceOnceOptions = {
  releaseId: string;
};

function cleanupOldMarkers(prefix: string, keepKey: string): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(prefix) && key !== keepKey) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore any cleanup errors
  }
}

/**
 * Force-enable a list of feature flags once per release/build.
 * Uses a versioned localStorage marker so it re-applies on each new build.
 */
export function forceEnableFlagsOnce(flags: FlagKey[], options: ForceOnceOptions): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const markerPrefix = '__ff_once__enable__';
    const markerKey = `${markerPrefix}${options.releaseId}`;

    // Always clean up older one-time markers to avoid LS bloat
    cleanupOldMarkers(markerPrefix, markerKey);

    if (window.localStorage.getItem(markerKey) === 'done') {
      return;
    }

    for (const flagKey of flags) {
      try {
        FeatureFlagsStore.set(flagKey, true);
      } catch {
        // Ignore and continue enabling other flags
      }
    }

    window.localStorage.setItem(markerKey, 'done');
  } catch {
    // Swallow errors to avoid impacting app startup
  }
}
