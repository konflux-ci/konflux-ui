import * as React from 'react';
import type { ConditionKey } from './conditions';
import { type FlagKey } from './flags';
import { FeatureFlagsStore } from './store';
import { getAllConditionsKeysFromFlags } from './utils';

export const useIsOnFeatureFlag = (key: FlagKey): boolean => {
  return React.useSyncExternalStore(
    (cb) => FeatureFlagsStore.subscribe(cb),
    () => FeatureFlagsStore.isOn(key),
  );
};

export const useFeatureFlags = (): [
  Record<FlagKey, boolean>,
  (key: FlagKey, value: boolean) => void,
] => {
  const set = React.useCallback((key: FlagKey, value: boolean) => {
    FeatureFlagsStore.set(key, value);
  }, []);
  const flags = React.useSyncExternalStore(
    (cb) => FeatureFlagsStore.subscribe(cb),
    () => FeatureFlagsStore.state,
  );
  return [flags, set];
};

type IfFeatureProps = {
  flag: FlagKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};
export const IfFeature: React.FC<IfFeatureProps> = ({ flag, children, fallback }) => {
  const isOn = useIsOnFeatureFlag(flag);
  return <>{isOn ? children : fallback ?? null}</>;
};

export const createConditionsHook = (
  keys: ConditionKey[],
): (() => Record<(typeof keys)[number], boolean>) => {
  return () => {

    React.useEffect(() => {
      void FeatureFlagsStore.ensureConditions(keys);
    }, []);

    const conditions = React.useSyncExternalStore(
      (cb) => FeatureFlagsStore.subscribe(cb),
      () => FeatureFlagsStore.conditions,
    );

    return keys.reduce(
      (acc, key) => {
        acc[key] = conditions[key] ?? false;
        return acc;
      },
      {} as Record<(typeof keys)[number], boolean>,
    );
  };
};

export const useAllFlagsConditions = createConditionsHook(getAllConditionsKeysFromFlags());
