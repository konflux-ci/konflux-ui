import * as React from 'react';
import { useK8sWatchResource } from '../k8s';
import { IntegrationTestScenarioGroupVersionKind, IntegrationTestScenarioModel } from '../models';
import { IntegrationTestScenarioKind } from '../types/coreBuildService';
import { filterDeletedResources } from '../utils/resource-utils';

export const useIntegrationTestScenarioV2 = (
  namespace: string,
  groupName: string,
  testName: string,
): [IntegrationTestScenarioKind | null, boolean, unknown] => {
  const {
    data: test,
    isLoading,
    error,
  } = useK8sWatchResource<IntegrationTestScenarioKind>(
    {
      groupVersionKind: IntegrationTestScenarioGroupVersionKind,
      name: testName,
      namespace,
    },
    IntegrationTestScenarioModel,
  );

  return React.useMemo(() => {
    if (!isLoading && !error) {
      const integrationTest =
        test?.spec?.componentGroup === groupName && !test?.metadata?.deletionTimestamp
          ? test
          : null;
      if (!integrationTest) {
        return [null, !isLoading, { code: 404 }];
      }
      return [integrationTest, !isLoading, error];
    }

    return [null, !isLoading, error];
  }, [isLoading, test, error, groupName]);
};

export const useIntegrationTestScenariosV2 = (
  namespace: string,
  groupName: string | undefined,
): [IntegrationTestScenarioKind[], boolean, unknown] => {
  const {
    data: tests,
    isLoading,
    error,
  } = useK8sWatchResource<IntegrationTestScenarioKind[]>(
    {
      groupVersionKind: IntegrationTestScenarioGroupVersionKind,
      namespace,
      isList: true,
    },
    IntegrationTestScenarioModel,
    {
      filterData: filterDeletedResources as (
        resource: IntegrationTestScenarioKind[],
      ) => IntegrationTestScenarioKind[],
    },
  );

  const integrationTests = React.useMemo(() => {
    return !isLoading && !error
      ? (tests?.filter((c) => c?.spec?.componentGroup === groupName) ?? [])
      : [];
  }, [groupName, error, isLoading, tests]);

  return [integrationTests, !isLoading, error];
};
