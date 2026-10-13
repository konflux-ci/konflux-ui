import type { HealthCheck } from '@redhat-cloud-services/lightspeed-client';
import { createConditionsHook } from '~/feature-flags/hooks';
import { ensureConditionIsOn } from '~/feature-flags/utils';
import { getLightspeedClient } from '~/lightspeed/lightspeedClient';
import { LIGHTSPEED_HEALTH_CHECK_TIMEOUT_MS } from '~/lightspeed/lightspeedConfig';

const isLightspeedHealthy = (health: HealthCheck): boolean =>
  health.status === 'healthy' && health.alive && health.ready;

/**
 * Runtime liveness re-validation for Konflux Lightspeed via the client health check
 * (`GET /liveness` and `GET /readiness` on the Lightspeed service).
 * Re-run periodically through the `isLightspeedAvailable` condition TTL.
 */
export const checkIfLightspeedIsAvailable = async (): Promise<boolean> => {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), LIGHTSPEED_HEALTH_CHECK_TIMEOUT_MS);

  try {
    const health = await getLightspeedClient().healthCheck({ signal: abortController.signal });
    return isLightspeedHealthy(health);
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const useIsLightspeedAvailable = createConditionsHook(['isLightspeedAvailable']);

export const isLightspeedAvailable = ensureConditionIsOn(['isLightspeedAvailable']);
