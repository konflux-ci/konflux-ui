import * as React from 'react';
import { useK8sWatchResource } from '../k8s/hooks/useK8sWatchResource';
import { ComponentGroupVersionKind, ComponentModel } from '../models';
import { ComponentKind } from '../types';

// export const useComponent = (
//   namespace: string,
//   componentName?: string,
// ): [ComponentKind, boolean, unknown] => {
//   const [component, componentsLoaded, error] = useK8sWatchResource<ComponentKind>(
//     componentName
//       ? {
//           groupVersionKind: ComponentGroupVersionKind,
//           namespace,
//           name: componentName,
//         }
//       : undefined,
//   );
//   return React.useMemo(() => {
//     if (componentsLoaded && !error && component?.metadata.deletionTimestamp) {
//       return [null, componentsLoaded, { code: 404 }];
//     }
//     return [component, componentsLoaded, error];
//   }, [component, componentsLoaded, error]);
// };

export const useComponents = (
  namespace: string,
  workspace: string,
  applicationName: string,
): [ComponentKind[], boolean, unknown] => {
  const {
    data: components,
    isLoading: componentsLoaded,
    error,
  } = useK8sWatchResource(
    {
      groupVersionKind: ComponentGroupVersionKind,
      workspace,
      namespace,
      isList: true,
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

// const sortComponentsByCreation = (components: ComponentKind[]): ComponentKind[] =>
//   components.sort(
//     (a, b) =>
//       new Date(b.metadata?.creationTimestamp).getTime() -
//       new Date(a.metadata?.creationTimestamp).getTime(),
//   );

// export const useSortedComponents = (
//   applicationName: string,
//   namespace?: string,
// ): [ComponentKind[], boolean, unknown] => {
//   const { namespace: ns } = useWorkspaceInfo();
//   const [cmps, loaded, error] = useComponents(namespace ?? ns, applicationName);

//   const components = React.useMemo(() => {
//     return loaded && !error ? sortComponentsByCreation(cmps) : [];
//   }, [cmps, error, loaded]);

//   return [components, loaded, error];
// };

// export const useAllComponents = (namespace: string): [ComponentKind[], boolean, unknown] => {
//   const [components, componentsLoaded, error] = useK8sWatchResource<ComponentKind[]>(
//     namespace
//       ? {
//           groupVersionKind: ComponentGroupVersionKind,
//           namespace,
//           isList: true,
//         }
//       : null,
//   );
//   const allComponents: ComponentKind[] = React.useMemo(
//     () => (componentsLoaded ? components?.filter((c) => !c.metadata.deletionTimestamp) || [] : []),
//     [components, componentsLoaded],
//   );
//   return [allComponents, componentsLoaded, error];
// };
