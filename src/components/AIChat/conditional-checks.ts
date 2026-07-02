import { LIGHTSPEED_API_BASE } from '~/components/AIChat/consts';
import { logger } from '~/monitoring/logger';

export const checkIfLightspeedIsAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${LIGHTSPEED_API_BASE}/liveness`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    logger.debug('Lightspeed liveness check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
};
