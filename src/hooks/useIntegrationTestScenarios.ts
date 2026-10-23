import * as React from 'react';
import { useK8sWatchResource } from '../k8s';
import { IntegrationTestScenarioGroupVersionKind, IntegrationTestScenarioModel } from '../models';
import { IntegrationTestScenarioKind } from '../types/coreBuildService';
import { filterDeletedResources } from '../utils/resource-utils';

export const useIntegrationTestScenario = (
  namespace: string,
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
    },
    IntegrationTestScenarioModel,
  );

  return React.useMemo(() => {
    if (!isLoading && !error) {
      if (!test) {
        return [null, true, { code: 404 }];
      }
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

export const useIntegrationTestScenariosByComponentGroup = (
  namespace: string,
  groupName: string | undefined,
): [IntegrationTestScenarioKind[] | undefined, boolean, unknown] => {
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
    return !isLoading && !error ? tests?.filter((c) => c.spec.componentGroup === groupName) : [];
  }, [groupName, error, isLoading, tests]);

  return [integrationTests, !isLoading, error];
};

export type IntegrationTestScenarioContext = {
  applicationName?: string;
  groupName?: string;
};

export const useIntegrationTestScenarioForContext = (
  namespace: string,
  testName: string,
  context: IntegrationTestScenarioContext,
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

  const { applicationName, groupName } = context;

  return React.useMemo(() => {
    if (isLoading || error) {
      return [null, !isLoading, error];
    }
    if (!test || test.metadata.deletionTimestamp) {
      return [null, true, { code: 404 }];
    }
    const matches = groupName
      ? test.spec.componentGroup === groupName
      : test.spec.application === applicationName;
    if (!matches) {
      return [null, true, { code: 404 }];
    }
    return [test, true, error];
  }, [isLoading, test, error, applicationName, groupName]);
};
