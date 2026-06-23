import { isDeveloperMockMode } from '~/dev-mock';
import { createConditionsHook } from '~/feature-flags/hooks';
import { ensureConditionIsOn } from '~/feature-flags/utils';
import { commonFetch } from '~/k8s';

export const checkIfKiteServiceIsEnabled = async () => {
  if (isDeveloperMockMode()) return true;
  try {
    const response = await commonFetch('/api/v1/health/', { pathPrefix: 'plugins/kite' });
    return response.ok;
  } catch (error) {
    return false;
  }
};

export const useIsKiteServiceEnabled = createConditionsHook(['isKiteServiceEnabled']);

export const isKiteServiceEnabled = ensureConditionIsOn(['isKiteServiceEnabled']);
