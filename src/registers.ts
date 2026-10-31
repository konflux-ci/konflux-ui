import { checkIfAnalyticsIsEnabled } from '~/analytics/conditional-checks';
import { checkIfSystemNotificationsAccessible } from '~/components/KonfluxSystemNotifications/conditional-checks';
import { getKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { LIGHTSPEED_CONDITION_TTL_MS } from '~/lightspeed/lightspeedConfig';
import { KonfluxInstanceEnvironments } from '~/types/konflux-public-info';
import { registerCondition } from './feature-flags/conditions';
import { checkIfImageControllerIsEnabled } from './image-controller/conditional-checks';
import { checkIfKiteServiceIsEnabled } from './kite/conditional-checks';
import { checkIfKubeArchiveIsEnabled } from './kubearchive/conditional-checks';

registerCondition('isKubearchiveEnabled', checkIfKubeArchiveIsEnabled);
registerCondition('isKiteServiceEnabled', checkIfKiteServiceIsEnabled);
registerCondition('isImageControllerEnabled', checkIfImageControllerIsEnabled);
registerCondition('isSystemNotificationsAccessible', checkIfSystemNotificationsAccessible);
registerCondition('isAnalyticsEnabled', checkIfAnalyticsIsEnabled);
registerCondition(
  'isLightspeedAvailable',
  async () =>
    (await import('~/lightspeed/conditional-checks')).checkIfLightspeedIsAvailable(),
  LIGHTSPEED_CONDITION_TTL_MS,
);

registerCondition('isStagingCluster', async () => {
  try {
    return (await getKonfluxPublicInfo()).environment === KonfluxInstanceEnvironments.STAGING;
  } catch {
    return false;
  }
});

export const REGISTRATIONS_LOADED = true;
