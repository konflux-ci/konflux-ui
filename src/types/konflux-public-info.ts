import { ConfigMap } from './configmap';

export type KonfluxPublicInfoConfigMap = ConfigMap & { data: { 'info.json': string } };

export type KonfluxRbacItem = {
  displayName: string;
  description: object;
  roleRef: {
    apiGroup: string;
    kind: string;
    name: string;
  };
};

export type SBOMEventNotification = {
  title: string;
  event: string;
  method: string;
  config: {
    url: string;
  };
};

export type KonfluxPublicInfoIntegrations = {
  github?: {
    application_url?: string;
  };
  sbom_server?: {
    url?: string;
    sbom_sha?: string;
  };
  image_controller?: {
    enabled?: boolean;
    notifications?: SBOMEventNotification[];
  };
};

export type KonfluxPublicInfo = {
  environment?: string;
  integrations?: KonfluxPublicInfoIntegrations;
  rbac: KonfluxRbacItem[];
  visibility?: 'public' | 'private';
};
