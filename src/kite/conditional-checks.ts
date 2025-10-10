import { createConditionsHook } from '~/feature-flags/hooks';
import { ensureConditionIsOn } from '~/feature-flags/utils';
import { commonFetch } from '~/k8s';

export const checkIfKiteServiceIsEnabled = async () => {
  try {
    await commonFetch('/api/v1/health/', { pathPrefix: 'plugins/kite' });
    return true;
  } catch (error) {
    return false;
  }
};

export const useIsKiteServiceEnabled = createConditionsHook(['isKiteServiceEnabled']);

export const isKiteServiceEnabled = ensureConditionIsOn(['isKiteServiceEnabled']);
