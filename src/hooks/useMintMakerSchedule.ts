import { useMemo } from 'react';
import { MINTMAKER_NAMESPACE, MINTMAKER_SCHEDULE_CONFIGMAP } from '~/consts/constants';
import { useK8sWatchResource } from '~/k8s/hooks';
import { ConfigMapGroupVersionKind, ConfigMapModel } from '~/models';
import { ConfigMap } from '~/types/configmap';

export type MintMakerScheduleEntry = {
  manager: string;
  nextRun: string;
};

const SCHEDULE_SUFFIX = '_scheduled_times.txt';

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

  const schedule = useMemo(() => {
    if (isLoading || error || !configMap?.data) {
      return [];
    }

    const entries = Object.entries(configMap.data).reduce<MintMakerScheduleEntry[]>(
      (acc, [key, value]: [string, string]) => {
        if (typeof value !== 'string' || !key.endsWith(SCHEDULE_SUFFIX)) {
          return acc;
        }

        const manager = key.replace(SCHEDULE_SUFFIX, '');
        const timestamps = value.trim().split('\n').filter(Boolean);
        for (const t of timestamps) {
          if (Date.parse(t) > Date.now()) {
            acc.push({ manager, nextRun: t });
            break;
          }
        }

        return acc;
      },
      [],
    );

    return [...entries].sort((s1, s2) => s1.nextRun.localeCompare(s2.nextRun));
  }, [configMap?.data, isLoading, error]);

  return useMemo(() => [schedule, !isLoading, error] as const, [schedule, isLoading, error]);
};
