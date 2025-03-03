import * as React from 'react';
import { useAllComponents, useComponents } from '../../hooks/useComponents';
import { useNamespace } from '../../shared/providers/Namespace';
import { ComponentKind, NudgeStats } from '../../types';
import { ComponentRelationNudgeType, ComponentRelationValue } from './type';

export const useNudgeData = (application: string): [ComponentRelationValue[], boolean, unknown] => {
  const namespace = useNamespace();
  const [components, loaded, error] = useComponents(namespace, application);
  const [allComponents, allLoaded, allErrors] = useAllComponents(namespace);
  const nudgeData: ComponentRelationValue[] = React.useMemo(() => {
    return loaded && !error && allLoaded && !allErrors
      ? components.reduce((acc, val: ComponentKind) => {
          if (val.spec?.[NudgeStats.NUDGES]) {
            const data: ComponentRelationValue = {
              source: val.metadata.name,
              nudgeType: ComponentRelationNudgeType.NUDGES,
              target: val.spec[NudgeStats.NUDGES]?.filter(
                (cname) => !!allComponents?.find((co) => co?.metadata?.name === cname),
              ),
            };
            return [...acc, data];
          }
          return acc;
        }, [])
      : [];
  }, [allComponents, allErrors, allLoaded, components, error, loaded]);

  return [nudgeData, loaded, error];
};
