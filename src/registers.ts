import { getKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { KonfluxInstanceEnvironments } from '~/types/konflux-public-info';
import { registerCondition } from './feature-flags/conditions';
import { checkIfKubeArchiveIsEnabled } from './kubearchive/conditional-checks';

registerCondition('isKubearchiveEnabled', checkIfKubeArchiveIsEnabled);

registerCondition('isStagingCluster', async () => {
  try {
    const info = await getKonfluxPublicInfo();
    return info.environment === KonfluxInstanceEnvironments.STAGING;
  } catch (error) {
    return false;
  }
});

// Export something to prevent tree-shaking
export const REGISTRATIONS_LOADED = true;
