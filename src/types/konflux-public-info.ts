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

export const KonfluxInstanceVisibility = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const;

export type KonfluxInstanceVisibilityType =
  (typeof KonfluxInstanceVisibility)[keyof typeof KonfluxInstanceVisibility];

export const KonfluxInstanceEnvironments = {
  STAGING: 'staging',
  PRODUCTION: 'production',
} as const;

export type KonfluxInstanceEnvironmentType =
  (typeof KonfluxInstanceEnvironments)[keyof typeof KonfluxInstanceEnvironments];

export type KonfluxPublicInfo = {
  environment?: KonfluxInstanceEnvironmentType;
  integrations?: KonfluxPublicInfoIntegrations;
  rbac: KonfluxRbacItem[];
  visibility?: KonfluxInstanceVisibilityType;
};
