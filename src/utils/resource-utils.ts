import { K8sResourceCommon } from '../types/k8s';

export const filterDeletedResources = <R extends K8sResourceCommon[]>(resources: R) => {
  return resources.filter((res) => !res.metadata.deletionTimestamp);
};
