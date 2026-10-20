import { createConditionsHook } from '~/feature-flags/hooks';
import { ensureConditionIsOn } from '~/feature-flags/utils';
import { commonFetch } from '~/k8s';
import { KUEUE_VISIBILITY_API_PATH } from './const';

/**
 * Checks whether the Kueue visibility API is available on this cluster by hitting
 * the API group discovery endpoint. Kueue and tekton-kueue are deployed separately
 * from the Konflux operator (not every cluster has them), so this must be checked
 * at runtime rather than assumed.
 */
export const checkIfKueueIsAvailable = async () => {
  try {
    await commonFetch(KUEUE_VISIBILITY_API_PATH);
    return true;
  } catch {
    return false;
  }
};

export const useIsKueueAvailable = createConditionsHook(['isKueueAvailable']);

export const isKueueAvailable = ensureConditionIsOn(['isKueueAvailable']);
