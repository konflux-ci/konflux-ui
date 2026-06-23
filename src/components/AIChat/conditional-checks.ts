import { getLightspeedClient } from '~/components/AIChat/lightspeedClient';
import { logger } from '~/monitoring/logger';

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
