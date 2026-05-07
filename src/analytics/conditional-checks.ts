import { createConditionsHook } from '~/feature-flags/hooks';
import { whenAnalyticsReady } from '.';

export const checkIfAnalyticsIsEnabled = () => whenAnalyticsReady();

export const useIsAnalyticsEnabled = createConditionsHook(['isAnalyticsEnabled']);
