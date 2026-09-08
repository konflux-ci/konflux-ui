import type { HealthCheck } from '@redhat-cloud-services/lightspeed-client';
import { createConditionsHook } from '~/feature-flags/hooks';
import { ensureConditionIsOn } from '~/feature-flags/utils';
import { getLightspeedClient } from '~/lightspeed/lightspeedClient';
import { LIGHTSPEED_HEALTH_CHECK_TIMEOUT_MS } from '~/lightspeed/lightspeedConfig';
import { logger } from '~/monitoring/logger';

const isHealthCheckResponse = (health: unknown): health is HealthCheck => {
  if (typeof health !== 'object' || health === null) {
    return false;
  }

  const { status, alive, ready } = health as Partial<HealthCheck>;

  return (
    (status === 'healthy' || status === 'unhealthy') &&
    typeof alive === 'boolean' &&
    typeof ready === 'boolean'
  );
};

export const useIsLightspeedAvailable = createConditionsHook(['isLightspeedAvailable']);

export const isLightspeedAvailable = ensureConditionIsOn(['isLightspeedAvailable']);

/**
 * Discovers whether Konflux Lightspeed is available via the client health check
 * (`GET /liveness` and `GET /readiness` on the Lightspeed service).
 */
export const checkIfLightspeedIsAvailable = async (): Promise<boolean> => {
  const wasAvailable = isLightspeedAvailable();
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), LIGHTSPEED_HEALTH_CHECK_TIMEOUT_MS);

  try {
    const health = await getLightspeedClient().healthCheck({ signal: abortController.signal });

    if (!isHealthCheckResponse(health)) {
      logger.debug('Lightspeed health check returned unexpected response shape', { health });
      return false;
    }

    const isAvailable = health.status === 'healthy' && health.alive && health.ready;

    if (isAvailable !== wasAvailable) {
      logger.debug('Lightspeed availability changed', {
        from: wasAvailable,
        to: isAvailable,
        status: health.status,
        alive: health.alive,
        ready: health.ready,
        reason: health.reason,
      });
    } else if (!isAvailable) {
      logger.debug('Lightspeed health check reported unavailable', {
        status: health.status,
        alive: health.alive,
        ready: health.ready,
        reason: health.reason,
      });
    }

    return isAvailable;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
};
