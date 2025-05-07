import * as React from 'react';
import { FlagKey } from './flags';
import { FeatureFlagsStore } from './store';

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
