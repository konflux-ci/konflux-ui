import { checkIfAnalyticsIsEnabled } from '~/analytics/conditional-checks';
import { checkIfSystemNotificationsAccessible } from '~/components/KonfluxSystemNotifications/conditional-checks';
import { getKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { checkIfLightspeedIsAvailable } from '~/lightspeed/conditional-checks';
import { LIGHTSPEED_CONDITION_TTL_MS } from '~/lightspeed/lightspeedConfig';
import { KonfluxInstanceEnvironments } from '~/types/konflux-public-info';
import { registerCondition } from './feature-flags/conditions';
import { checkIfImageControllerIsEnabled } from './image-controller/conditional-checks';
import { checkIfKiteServiceIsEnabled } from './kite/conditional-checks';
import { checkIfKubeArchiveIsEnabled } from './kubearchive/conditional-checks';
import { checkIfKueueIsAvailable } from './kueue/conditional-checks';
import { KUEUE_CONDITION_TTL_MS } from './kueue/const';

registerCondition('isKubearchiveEnabled', checkIfKubeArchiveIsEnabled);
registerCondition('isKiteServiceEnabled', checkIfKiteServiceIsEnabled);
registerCondition('isImageControllerEnabled', checkIfImageControllerIsEnabled);
registerCondition('isSystemNotificationsAccessible', checkIfSystemNotificationsAccessible);
registerCondition('isAnalyticsEnabled', checkIfAnalyticsIsEnabled);
registerCondition('isLightspeedAvailable', checkIfLightspeedIsAvailable, LIGHTSPEED_CONDITION_TTL_MS);
registerCondition('isKueueAvailable', checkIfKueueIsAvailable, KUEUE_CONDITION_TTL_MS);

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
