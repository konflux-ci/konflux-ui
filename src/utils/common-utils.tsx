import { saveAs } from 'file-saver';
import { dump } from 'js-yaml';
import { curry } from 'lodash-es';
import { HttpError } from '~/k8s/error';
import { ApplicationKind, TaskRunKind } from '~/types';
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

export const downloadTaskRunYaml = (taskRun: TaskRunKind) => {
  if (!taskRun) return;
  const taskRunYaml = dump(taskRun) as string;
  const blob = new Blob([taskRunYaml], {
    type: 'text/yaml;charset=utf-8',
  });

  const filename = `${taskRun.metadata?.name || 'taskrun-details'}.yaml`;
  saveAs(blob, filename);
};
