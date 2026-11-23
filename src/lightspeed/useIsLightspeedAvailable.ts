import { createConditionsHook } from '~/feature-flags/hooks';

/**
 * Reads the `isLightspeedAvailable` condition. Kept free of Lightspeed client
 * imports so feature-flag / gate code does not pull the client into the main bundle.
 */
export const useIsLightspeedAvailable = createConditionsHook(['isLightspeedAvailable']);
