import * as React from 'react';
import { useK8sWatchResource } from '../k8s';
import { IntegrationTestScenarioGroupVersionKind, IntegrationTestScenarioModel } from '../models';
import { IntegrationTestScenarioKind } from '../types/coreBuildService';
import { filterDeletedResources } from '../utils/resource-utils';

export const useIntegrationTestScenario = (
  namespace: string,
  workspace: string,
  applicationName: string,
  testName: string,
): [IntegrationTestScenarioKind, boolean, unknown] => {
  const {
    data: test,
    isLoading,
    error,
  } = useK8sWatchResource<IntegrationTestScenarioKind>(
    {
      groupVersionKind: IntegrationTestScenarioGroupVersionKind,
      name: testName,
      namespace,
      workspace,
    },
    IntegrationTestScenarioModel,
  );

  return React.useMemo(() => {
    if (!isLoading && !error) {
      const integrationTest =
        test.spec.application === applicationName && !test.metadata.deletionTimestamp ? test : null;
      if (!integrationTest) {
        return [null, !isLoading, { code: 404 }];
      }
      return [integrationTest, !isLoading, error];
    }

    return [null, !isLoading, error];
  }, [isLoading, test, error, applicationName]);
};

export const useIntegrationTestScenarios = (
  namespace: string,
  workspace: string,
  applicationName: string,
): [IntegrationTestScenarioKind[], boolean, unknown] => {
  const {
    data: tests,
    isLoading,
    error,
  } = useK8sWatchResource<IntegrationTestScenarioKind[]>(
    {
      groupVersionKind: IntegrationTestScenarioGroupVersionKind,
      namespace,
      workspace,
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
    return !isLoading && !error ? tests.filter((c) => c.spec.application === applicationName) : [];
  }, [applicationName, error, isLoading, tests]);

  return [integrationTests, !isLoading, error];
};
