import { HttpError } from '~/k8s/error';
import { ConditionKey } from './conditions';
import { FLAGS, type FlagKey } from './flags';
import { FeatureFlagsStore } from './store';

export const isFeatureFlagOn = (flag: FlagKey): boolean => FeatureFlagsStore.isOn(flag);

/**
 * Compose helpers for data-router loaders/lazy to guard routes by feature flags.
 * These are non-hook utilities and safe to call in loaders.
 */
export const ensureFeatureFlagOnLoader = (flag: FlagKey): void => {
  if (!isFeatureFlagOn(flag)) {
    // Let RouteErrorBoundary render a 404
    throw HttpError.fromCode(404);
  }
};

export const getAllConditionsKeysFromFlags = (): ConditionKey[] => {
  const keys = Object.values(FLAGS).reduce((acc, flag) => {
    const guard = flag.guard;
    if (guard) {
      if (Array.isArray(guard.allOf)) {
        guard.allOf.forEach((k) => acc.add(k));
      }
      if (Array.isArray(guard.anyOf)) {
        guard.anyOf.forEach((k) => acc.add(k));
      }
    }
    return acc;
  }, new Set<ConditionKey>());
  return Array.from(keys);
};

export const ensureConditionIsOn = (keys: ConditionKey[]) => () => {
  return keys.every((key) => FeatureFlagsStore.conditions[key]);
};
