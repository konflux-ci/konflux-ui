import * as React from 'react';
import { useK8sWatchResource } from '~/k8s';
import { NudgeConfigGroupVersionKind, NudgeConfigModel } from '~/models';
import { NudgeConfigKind } from '~/types';

const NUDGE_CONFIG_NAME = 'nudge-config';

/**
 * Fetches the namespace's singleton NudgeConfig resource (named "nudge-config").
 * A namespace with no nudge relationships simply has none. A 404 is therefore treated
 * as "no NudgeConfig", not an error.
 *
 * NudgeConfig is the CRD-based store for nudge relationships (see ADR 0067:
 * https://github.com/konflux-ci/architecture/blob/main/ADR/0067-nudging-relationship-singleton-crd.md),
 * replacing the per-component `build-nudges-ref` spec entries still read by
 * the Component view's useNudgeData.
 */
export const useNudgeConfig = (
  namespace: string,
  watch?: boolean,
): [NudgeConfigKind | null, boolean, unknown] => {
  const { data, isLoading, error } = useK8sWatchResource<NudgeConfigKind>(
    namespace
      ? {
          groupVersionKind: NudgeConfigGroupVersionKind,
          namespace,
          name: NUDGE_CONFIG_NAME,
          watch,
        }
      : undefined,
    NudgeConfigModel,
  );

  return React.useMemo(() => {
    const isNotFound =
      !isLoading && typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: number }).code === 404
        : false;
    if (isNotFound) {
      return [null, true, undefined];
    }
    return [!isLoading && !error ? (data ?? null) : null, !isLoading, error];
  }, [data, isLoading, error]);
};
