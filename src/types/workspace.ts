import { K8sResourceCommon } from './k8s';

export interface Workspace extends K8sResourceCommon {
  status: {
    type?: string;
    namespaces: {
      name: string;
      type?: string;
    }[];
    owner: string;
  };
}

export interface Namespace {
  name: string;
  type?: string;
}

export type NamespaceRole = 'Contributor' | 'Maintainer' | 'Admin';
