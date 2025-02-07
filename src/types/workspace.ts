import { K8sResourceCommon } from './k8s';

export interface Workspace extends K8sResourceCommon {
  status: {
    type?: string;
    namespaces: {
      name: string;
      type?: string;
    }[];
    owner: string;
    role: WorkspaceRole;
    availableRoles?: WorkspaceRole[];
    bindings?: WorkspaceBinding[];
  };
}

export type WorkspaceRole = 'contributor' | 'maintainer' | 'admin';

export interface WorkspaceBinding {
  masterUserRecord: string;
  role: WorkspaceRole;
  availableActions?: ('update' | 'delete')[];
  bindingRequest?: {
    name: string;
    namespace: string;
  };
}
