import { QueryFunctionContext } from '@tanstack/react-query';
import { K8sGroupVersionKind } from '../../types/k8s';
import { getResource, listResourceItems, K8sResourceBaseOptions } from '../k8s-fetch';
import { getReference } from '../k8s-utils';

export const createQueryKeys = (model: K8sGroupVersionKind, workspace?: string, name?: string) => {
  const workspaceKey = workspace ? [workspace] : [];
  const nameKey = name ? [name] : ['all'];
  return [getReference(model), ...workspaceKey, ...nameKey];
};

export const createQueryFunction =
  (isList: boolean) => (args: K8sResourceBaseOptions) => (_: QueryFunctionContext) => {
    return (isList ? listResourceItems : getResource)(args);
  };
