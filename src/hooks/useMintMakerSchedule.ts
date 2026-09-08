import { useMemo } from 'react';
import { MINTMAKER_NAMESPACE, MINTMAKER_SCHEDULE_CONFIGMAP } from '~/consts/constants';
import { useK8sWatchResource } from '~/k8s/hooks';
import { ConfigMapGroupVersionKind, ConfigMapModel } from '~/models';
import { useCurrentTime } from '~/shared/hooks/useCurrentTime';
import { ConfigMap } from '~/types/configmap';
import {
  getMintMakerSchedule,
  type MintMakerScheduleEntry,
} from '~/utils/mintmaker-schedule-utils';

export type { MintMakerScheduleEntry } from '~/utils/mintmaker-schedule-utils';

const SCHEDULE_REFRESH_INTERVAL_MS = 60_000;

export const useMintMakerSchedule = (): [MintMakerScheduleEntry[], boolean, unknown] => {
  const resourceInit = {
    groupVersionKind: ConfigMapGroupVersionKind,
    namespace: MINTMAKER_NAMESPACE,
    isList: false,
    name: MINTMAKER_SCHEDULE_CONFIGMAP,
  } as const;

  const {
    data: configMap,
    isLoading,
    error,
  } = useK8sWatchResource<ConfigMap>(resourceInit, ConfigMapModel);

  const currentTime = useCurrentTime(
    !isLoading && !error && Boolean(configMap?.data),
    SCHEDULE_REFRESH_INTERVAL_MS,
  );

  const schedule = useMemo(() => {
    if (isLoading || error || !configMap?.data) {
      return [];
    }

    return getMintMakerSchedule(configMap.data, currentTime);
  }, [configMap?.data, currentTime, isLoading, error]);

  return useMemo(() => [schedule, !isLoading, error] as const, [schedule, isLoading, error]);
};
