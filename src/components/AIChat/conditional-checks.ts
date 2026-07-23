import { getLightspeedClient } from '~/components/AIChat/lightspeedClient';
import { createConditionsHook } from '~/feature-flags/hooks';
import { ensureConditionIsOn } from '~/feature-flags/utils';
import { logger } from '~/monitoring/logger';

/**
 * Discovers whether Konflux Lightspeed is available via the client health check
 * (`GET /liveness` and `GET /readiness` on the Lightspeed service).
 */
export const checkIfLightspeedIsAvailable = async (): Promise<boolean> => {
  try {
    const health = await getLightspeedClient().healthCheck();
    return health.status === 'healthy' && health.alive;
  } catch (error) {
    logger.debug('Lightspeed liveness check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
};

export const useIsLightspeedAvailable = createConditionsHook(['isLightspeedAvailable']);

export const isLightspeedAvailable = ensureConditionIsOn(['isLightspeedAvailable']);
