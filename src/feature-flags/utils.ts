import { HttpError } from '~/k8s/error';
import type { FlagKey } from './flags';
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
