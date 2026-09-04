import { ConfigMap } from './configmap';

export type KonfluxPublicInfoConfigMap = ConfigMap & { data: { 'info.json': string } };

export type KonfluxRbacItem = {
  displayName: string;
  description: string;
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

export type ImageProxy = {
  url: string;
  oauthPath: string;
};

export type CliLogin = {
  apiServerUrl: string;
  /** Present for OpenShift clusters; unused for Kind / plain Kubernetes. */
  oauthTokenRequestUrl?: string;
  /**
   * `openshift` → `oc login --web` (Openshift clusters).
   * `kubernetes` → kubectl context (local Kind without OpenShift OAuth).
   * When omitted, inferred from `openshiftVersion` / OAuth URL shape.
   */
  authMode?: 'openshift' | 'kubernetes';
  /** Optional kubeconfig context name for Kubernetes / Kind clusters. */
  kubeContext?: string;
};

export type KonfluxPublicInfo = {
  imageProxyUrl?: string; // Deprecated: kept for backward compatibility
  imageProxy?: ImageProxy;
  environment?: KonfluxInstanceEnvironmentType;
  statusPageUrl?: string;
  integrations?: KonfluxPublicInfoIntegrations;
  rbac: KonfluxRbacItem[];
  visibility?: KonfluxInstanceVisibilityType;
  clusterId?: string;
  clusterVersion?: string;
  konfluxVersion?: string;
  kubernetesVersion?: string;
  openshiftVersion?: string;
  cliLogin?: CliLogin;
};
