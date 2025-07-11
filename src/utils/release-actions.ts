import { ReleaseLabel } from '../consts/release';
import { K8sQueryCreateResource } from '../k8s';
import { ReleaseGroupVersionKind, ReleaseModel } from '../models';
import { ReleaseKind } from '../types';
import { generateNewReleaseName } from './release-utils';

export const releaseRerun = (release: ReleaseKind, username: string) => {
  const newName = generateNewReleaseName(release.metadata?.name ?? '');

  const newRelease: ReleaseKind = {
    ...release,
    apiVersion: `${ReleaseGroupVersionKind.group}/${ReleaseGroupVersionKind.version}`,
    metadata: {
      ...release.metadata,
      creationTimestamp: undefined,
      finalizers: undefined,
      generateName: `${newName}`,
      generation: undefined,
      ownerReferences: undefined,
      resourceVersion: undefined,
      uid: undefined,
      name: undefined,
      labels: {
        ...release.metadata.labels,
        [ReleaseLabel.AUTOMATED]: 'false',
        [ReleaseLabel.AUTHOR]: username,
      },
    },
    status: undefined,
  };

  return K8sQueryCreateResource({
    model: ReleaseModel,
    queryOptions: {
      name: release.metadata.name,
      ns: release.metadata.namespace,
    },
    resource: newRelease,
  });
};
