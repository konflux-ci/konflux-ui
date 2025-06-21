import { curry } from 'lodash-es';
import { PipelineRunModel } from '../models';
import { K8sModelCommon, K8sResourceCommon, OwnerReference } from '../types/k8s';
import { ApplicationKind } from '~/types';

export const getApplicationDisplayName = (application: ApplicationKind): string =>
  application?.spec?.displayName ?? application?.metadata?.name;

export const getResourceFromOwnerReference = curry(
  (model: K8sModelCommon, resource: K8sResourceCommon): OwnerReference => {
    return resource
      ? resource.metadata.ownerReferences?.find((res) => res.kind === model.kind)
      : undefined;
  },
);

export const getPipelineRunFromTaskRunOwnerRef = getResourceFromOwnerReference(PipelineRunModel);
