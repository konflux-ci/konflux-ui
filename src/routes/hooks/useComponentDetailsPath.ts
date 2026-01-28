import { useCallback } from 'react';
import { useIsOnFeatureFlag } from '../../feature-flags/hooks';
import { useNamespace } from '../../shared/providers/Namespace';
import { COMPONENT_DETAILS_PATH, COMPONENT_DETAILS_V2_PATH } from '../paths';

const useComponentDetailsPath = () => {
  const namespace = useNamespace();
  const newComponentsEnabled = useIsOnFeatureFlag('components-page');

  const getComponentDetailsPath = useCallback(
    (applicationName: string, componentName: string) =>
      newComponentsEnabled
        ? COMPONENT_DETAILS_V2_PATH.createPath({
            workspaceName: namespace,
            componentName,
          })
        : COMPONENT_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
            componentName,
          }),
    [namespace, newComponentsEnabled],
  );

  return { getComponentDetailsPath };
};

export default useComponentDetailsPath;
