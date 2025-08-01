import * as React from 'react';
import { isPACEnabled } from '~/utils/component-utils';
import { useK8sWatchResource } from '../k8s';
import { ComponentGroupVersionKind, ComponentModel } from '../models';
import { useNamespace } from '../shared/providers/Namespace';
import { ComponentKind } from '../types';
import { useApplicationPipelineGitHubApp } from './useApplicationPipelineGitHubApp';

export const useComponent = (
  namespace: string,
  componentName: string,
  watch?: boolean,
): [ComponentKind, boolean, unknown] => {
  const {
    data: component,
    isLoading,
    error,
  } = useK8sWatchResource<ComponentKind>(
    componentName
      ? {
          groupVersionKind: ComponentGroupVersionKind,
          namespace,
          name: componentName,
          watch,
        }
      : undefined,
    ComponentModel,
  );
  return React.useMemo(() => {
    if (!isLoading && !error && component?.metadata.deletionTimestamp) {
      return [null, !isLoading, { code: 404 }];
    }
    return [component, !isLoading, error];
  }, [component, isLoading, error]);
};

export const useComponents = (
  namespace: string,
  applicationName: string,
  watch?: boolean,
): [ComponentKind[], boolean, unknown] => {
  const {
    data: components,
    isLoading: componentsLoaded,
    error,
  } = useK8sWatchResource<ComponentKind[]>(
    {
      groupVersionKind: ComponentGroupVersionKind,
      namespace,
      isList: true,
      watch,
    },
    ComponentModel,
  );
  const appComponents: ComponentKind[] = React.useMemo(
    () =>
      !componentsLoaded
        ? (components as unknown as ComponentKind[])?.filter(
            (c) => c.spec.application === applicationName && !c.metadata?.deletionTimestamp,
          ) || []
        : [],
    [components, applicationName, componentsLoaded],
  );
  return [appComponents, !componentsLoaded, error];
};

const sortComponentsByCreation = (components: ComponentKind[]): ComponentKind[] =>
  components.sort(
    (a, b) =>
      new Date(b.metadata?.creationTimestamp).getTime() -
      new Date(a.metadata?.creationTimestamp).getTime(),
  );

export const useSortedComponents = (
  applicationName: string,
  namespace?: string,
): [ComponentKind[], boolean, unknown] => {
  const ns = useNamespace();
  const [cmps, loaded, error] = useComponents(namespace ?? ns, applicationName);

  const components = React.useMemo(() => {
    return loaded && !error ? sortComponentsByCreation(cmps) : [];
  }, [cmps, error, loaded]);

  return [components, loaded, error];
};

export const useAllComponents = (namespace: string): [ComponentKind[], boolean, unknown] => {
  const {
    data: components,
    isLoading: componentsLoaded,
    error,
  } = useK8sWatchResource<ComponentKind[]>(
    {
      groupVersionKind: ComponentGroupVersionKind,
      namespace,
      isList: true,
    },
    ComponentModel,
  );
  const allComponents: ComponentKind[] = React.useMemo(
    () =>
      !componentsLoaded
        ? (components as unknown as ComponentKind[])?.filter(
            (c) => !c.metadata?.deletionTimestamp,
          ) || []
        : [],
    [components, componentsLoaded],
  );
  return [allComponents, !componentsLoaded, error];
};

export const useSortedGroupComponents = (
  namespace: string,
): [{ [application: string]: string[] }, boolean, unknown] => {
  const [allComponents, allCompsLoaded, allCompsError] = useAllComponents(namespace);
  const groupedComponents = React.useMemo(
    () =>
      allCompsLoaded && !allCompsError
        ? allComponents.reduce((acc, val) => {
            if (acc[val.spec.application]) {
              acc[val.spec.application] = [...acc[val.spec.application], val.metadata.name];
            } else {
              acc[val.spec.application] = [val.metadata.name];
            }
            return acc;
          }, {})
        : {},
    [allComponents, allCompsError, allCompsLoaded],
  );

  // Sort the grouped components
  const sortedGroupedComponents = React.useMemo(() => {
    return Object.keys(groupedComponents)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = [...groupedComponents[key]].sort();
          return acc;
        },
        {} as { [application: string]: string[] },
      );
  }, [groupedComponents]);

  return [sortedGroupedComponents, allCompsLoaded, allCompsError];
};

export const useURLForComponentPRs = (components: ComponentKind[]): string => {
  const GIT_URL_PREFIX = 'https://github.com/';
  const { name: PR_BOT_NAME } = useApplicationPipelineGitHubApp();
  const repos = components.reduce((acc, component) => {
    const gitURL = component.spec.source?.git?.url;
    if (gitURL && isPACEnabled(component) && gitURL.startsWith(GIT_URL_PREFIX)) {
      acc = `${acc}+repo:${gitURL.replace(GIT_URL_PREFIX, '').replace(/.git$/i, '')}`;
    }
    return acc;
  }, '');
  return `https://github.com/pulls?q=is:pr+is:open+author:app/${PR_BOT_NAME}${repos}`;
};
