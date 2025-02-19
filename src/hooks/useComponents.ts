import * as React from 'react';
import { useWorkspaceInfo } from '../components/Workspace/useWorkspaceInfo';
import { useK8sWatchResource } from '../k8s';
import { ComponentGroupVersionKind, ComponentModel } from '../models';
import { ComponentKind } from '../types';

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
  workspace: string,
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
      workspace,
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
  const { namespace: ns, workspace } = useWorkspaceInfo();
  const [cmps, loaded, error] = useComponents(namespace ?? ns, workspace, applicationName);

  const components = React.useMemo(() => {
    return loaded && !error ? sortComponentsByCreation(cmps) : [];
  }, [cmps, error, loaded]);

  return [components, loaded, error];
};

export const useAllComponents = (
  namespace: string,
  workspace: string,
): [ComponentKind[], boolean, unknown] => {
  const {
    data: components,
    isLoading: componentsLoaded,
    error,
  } = useK8sWatchResource<ComponentKind[]>(
    {
      groupVersionKind: ComponentGroupVersionKind,
      workspace,
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
