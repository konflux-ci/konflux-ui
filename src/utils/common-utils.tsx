import { saveAs } from 'file-saver';
import { dump } from 'js-yaml';
import { curry } from 'lodash-es';
import { HttpError } from '~/k8s/error';
import { ApplicationKind } from '~/types';
import { PipelineRunModel } from '../models';
import { K8sModelCommon, K8sResourceCommon, OwnerReference } from '../types/k8s';

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

export const has404Error = (error: unknown): error is HttpError => {
  return error instanceof HttpError && error.code === 404;
};

export const downloadYaml = <T extends K8sResourceCommon>(resource: T) => {
  if (!resource) return;
  const resourceYaml = dump(resource) as string;
  const blob = new Blob([resourceYaml], {
    type: 'text/yaml;charset=utf-8',
  });
  const filename = `${resource.metadata?.name || 'resource'}.yaml`;
  saveAs(blob, filename);
};
