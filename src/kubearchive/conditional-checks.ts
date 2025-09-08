import { createConditionsHook } from '~/feature-flags/hooks';
import { ensureConditionIsOn } from '~/feature-flags/utils';
import { commonFetch } from '~/k8s';
import { KUBEARCHIVE_PATH_PREFIX } from './const';

export const checkIfKubeArchiveIsEnabled = async () => {
  try {
    await commonFetch('/livez', { pathPrefix: KUBEARCHIVE_PATH_PREFIX });
    return true;
  } catch (error) {
    return false;
  }
};

export const useIsKubeArchiveEnabled = createConditionsHook(['isKubearchiveEnabled']);

export const isKubeArchiveEnabled = ensureConditionIsOn(['isKubearchiveEnabled']);
