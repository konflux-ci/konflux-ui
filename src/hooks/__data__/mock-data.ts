import yaml from 'js-yaml';
import { SecretKind, ServiceAccountKind } from '../../types';
import { LimitRange, SnapshotEnvironmentBinding } from '../../types/coreBuildService';
import { RouteKind } from '../../types/routes';

const baseSnapshotEnvironmentBinding: SnapshotEnvironmentBinding = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'SnapshotEnvironmentBinding',
  metadata: {
    creationTimestamp: '2023-02-21T05:10:22Z',
    generateName: 'test-app-prod-binding-',
    labels: {
      'appstudio.application': 'test-app',
      'appstudio.environment': 'prod',
    },
    name: 'test-app-prod-binding-dxbcz',
    namespace: 'test-ns',
    uid: '30341053-fe45-4bc3-824a-075af3b6ba23',
  },
  spec: {
    application: 'test-app',
    components: [
      {
        configuration: {
          env: [],
          replicas: 1,
        },
        name: 'test-app-devfile-sample-dlod-sample',
      },
    ],
    environment: 'prod',
    snapshot: 'test-app-dmmr7',
  },
};
export enum SEB_STATUS {
  SUCCEEDED = 'Succeeded',
  RUNNING = 'Running',
  MISSING = 'Missing',
  PARTIAL = 'Partial',
  DEGRADED = 'Degraded',
}

export const mockSnapshotEnvironmentBindings: {
  [key in SEB_STATUS]: SnapshotEnvironmentBinding[];
} = {
  [SEB_STATUS.MISSING]: [{ ...baseSnapshotEnvironmentBinding }],
  [SEB_STATUS.PARTIAL]: [
    {
      ...baseSnapshotEnvironmentBinding,
      status: {
        bindingConditions: [
          {
            lastTransitionTime: '2023-02-21T05:10:23Z',
            message:
              "Can not Reconcile Binding 'test-app-development-binding-dxbcz', since GitOps Repo Conditions status is false.",
            reason: 'ErrorOccurred',
            status: 'True',
            type: 'ErrorOccurred',
          },
        ],
        gitopsRepoConditions: [
          {
            lastTransitionTime: '2023-02-21T05:10:23Z',
            message:
              'GitOps repository sync failed: failed to push remote to repository "https://<TOKEN>@github.com/ch007m/test-app-nmNw5-identify-count" "fatal: could not read Password for \'https://<TOKEN>@github.com\': No such device or address\\n": exit status 128',
            reason: 'GenerateError',
            status: 'False',
            type: 'GitOpsResourcesGenerated',
          },
        ],
        gitopsDeployments: [
          {
            componentName: 'comp1',
            gitopsDeployment: 'test-app-prod-binding-dxbcz-test-app-prod-comp1-ccgs',
            health: 'Progressing',
            syncStatus: 'Unknown',
          },
          {
            componentName: 'comp2',
            gitopsDeployment: 'test-app-prod-binding-dxbcz-test-app-prod-comp2-xdss',
            health: 'Healthy',
            syncStatus: 'Unknown',
          },
          {
            componentName: 'comp3',
            gitopsDeployment: 'test-app-prod-binding-dxbcz-test-app-prod-comp3-jkkl',
            health: 'Healthy',
            syncStatus: 'Unknown',
          },
        ],
      },
    },
  ],
  [SEB_STATUS.SUCCEEDED]: [
    {
      ...baseSnapshotEnvironmentBinding,
      status: {
        bindingConditions: [
          {
            lastTransitionTime: '2023-02-21T05:26:52Z',
            message:
              "SnapshotEventBinding Component status is required to generate GitOps deployment, waiting for the Application Service controller to finish reconciling binding 'my-app-development-binding-w8plb'",
            reason: 'ErrorOccurred',
            status: 'True',
            type: 'ErrorOccurred',
          },
        ],
        componentDeploymentConditions: [
          {
            lastTransitionTime: '2023-02-21T05:27:25Z',
            message: '1 of 1 components deployed',
            reason: 'CommitsSynced',
            status: 'True',
            type: 'AllComponentsDeployed',
          },
        ],
        components: [
          {
            gitopsRepository: {
              branch: 'main',
              commitID: 'd99ca37ecdb9213a14123ff775f21f44f16d8c96',
              generatedResources: ['deployment-patch.yaml'],
              path: 'components/devfile-sample-guhp/overlays/development',
              url: 'https://github.com/redhat-appstudio-appdata/my-app-ls2Qa-assess-press',
            },
            name: 'devfile-sample-guhp',
          },
        ],
        gitopsDeployments: [
          {
            componentName: 'comp1',
            gitopsDeployment: 'test-app-prod-binding-dxbcz-test-app-prod-comp1-ccgs',
            health: 'Healthy',
            syncStatus: 'Unknown',
          },
          {
            componentName: 'comp2',
            gitopsDeployment: 'test-app-prod-binding-dxbcz-test-app-prod-comp2-xdss',
            health: 'Healthy',
            syncStatus: 'Unknown',
          },
          {
            componentName: 'comp3',
            gitopsDeployment: 'test-app-prod-binding-dxbcz-test-app-prod-comp3-jkkl',
            health: 'Healthy',
            syncStatus: 'Unknown',
          },
        ],
        gitopsRepoConditions: [
          {
            lastTransitionTime: '2023-02-21T05:26:53Z',
            message: 'GitOps repository sync successful',
            reason: 'OK',
            status: 'True',
            type: 'GitOpsResourcesGenerated',
          },
        ],
      },
    },
  ],
  [SEB_STATUS.RUNNING]: [
    {
      ...baseSnapshotEnvironmentBinding,
      status: {
        components: [
          {
            gitopsRepository: {
              branch: 'main',
              commitID: '95598ffacde7586c92a1eecf7c813080b8a9a1c8\n',
              generatedResources: ['deployment-patch.yaml'],
              path: 'components/test-nodeapp/overlays/production',
              url: 'https://github.com/HACbs-ui-org/test-application-jephilli-define-laugh',
            },
            name: 'test-nodeapp',
          },
        ],
        bindingConditions: [
          {
            lastTransitionTime: '2023-01-24T09:31:03Z',
            message:
              'SnapshotEventBinding Component status is required to generate GitOps deployment, waiting for the Application Service controller to finish reconciling',
            binding: 'test-app-2-development-binding-w7f2z',
            reason: 'ErrorOccurred',
            status: 'True',
            type: 'ErrorOccurred',
          },
        ],

        componentDeploymentConditions: [
          {
            lastTransitionTime: '2023-01-24T09:31:34Z',
            message: '1 of 1 components deployed',
            reason: 'CommitsUnsynced',
            status: 'False',
            type: 'AllComponentsDeployed',
          },
        ],
        gitopsDeployments: [
          {
            componentName: 'comp1',
            gitopsDeployment: 'test-app-prod-binding-dxbcz-test-app-prod-comp1-ccgs',
            health: 'Healthy',
            syncStatus: 'Unknown',
          },
          {
            componentName: 'comp2',
            gitopsDeployment: 'test-app-prod-binding-dxbcz-test-app-prod-comp2-xdss',
            health: 'Healthy',
            syncStatus: 'Unknown',
          },
          {
            componentName: 'comp3',
            gitopsDeployment: 'test-app-prod-binding-dxbcz-test-app-prod-comp3-jkkl',
            health: 'Progressing',
            syncStatus: 'Unknown',
          },
        ],
        gitopsRepoConditions: [
          {
            lastTransitionTime: '2022-11-09T17:33:47Z',
            message: 'GitOps repository sync successful',
            reason: 'OK',
            status: 'True',
            type: 'GitOpsResourcesGenerated',
          },
        ],
      },
    },
  ],
  [SEB_STATUS.DEGRADED]: [
    {
      ...baseSnapshotEnvironmentBinding,
      status: {
        components: [
          {
            gitopsRepository: {
              branch: 'main',
              commitID: '95598ffacde7586c92a1eecf7c813080b8a9a1c8\n',
              generatedResources: ['deployment-patch.yaml'],
              path: 'components/test-nodeapp/overlays/production',
              url: 'https://github.com/HACbs-ui-org/test-application-jephilli-define-laugh',
            },
            name: 'test-nodeapp',
          },
        ],
        bindingConditions: [
          {
            lastTransitionTime: '2023-01-24T09:31:03Z',
            message:
              'SnapshotEventBinding Component status is required to generate GitOps deployment, waiting for the Application Service controller to finish reconciling',
            binding: 'test-app-2-development-binding-w7f2z',
            reason: 'ErrorOccurred',
            status: 'True',
            type: 'ErrorOccurred',
          },
        ],

        componentDeploymentConditions: [
          {
            lastTransitionTime: '2023-01-24T09:31:34Z',
            message: '1 of 1 components deployed',
            reason: 'CommitsUnsynced',
            status: 'False',
            type: 'ErrorOccurred',
          },
        ],
        gitopsDeployments: [
          {
            componentName: 'comp1',
            gitopsDeployment: 'test-app-prod-binding-dxbcz-test-app-prod-comp1-ccgs',
            health: 'Healthy',
            syncStatus: 'Unknown',
          },
          {
            componentName: 'comp2',
            gitopsDeployment: 'test-app-prod-binding-dxbcz-test-app-prod-comp2-xdss',
            health: 'Degraded',
            syncStatus: 'Unknown',
          },
          {
            componentName: 'comp3',
            gitopsDeployment: 'test-app-prod-binding-dxbcz-test-app-prod-comp3-jkkl',
            health: 'Progressing',
            syncStatus: 'Unknown',
          },
        ],
        gitopsRepoConditions: [
          {
            lastTransitionTime: '2022-11-09T17:33:47Z',
            message: 'GitOps repository sync successful',
            reason: 'OK',
            status: 'True',
            type: 'GitOpsResourcesGenerated',
          },
        ],
      },
    },
  ],
};

export const mockRoutes: RouteKind[] = [
  {
    apiVersion: 'route.openshift.io/v1',
    kind: 'Route',
    metadata: {
      annotations: {
        'kubectl.kubernetes.io/last-applied-configuration':
          '{"apiVersion":"route.openshift.io/v1","kind":"Route","metadata":{"annotations":{},"creationTimestamp":null,"labels":{"app.kubernetes.io/created-by":"application-service","app.kubernetes.io/instance":"gitopsdepl-f56e3027-168b-43cf-aa3a-99d784d69b05","app.kubernetes.io/managed-by":"kustomize","app.kubernetes.io/name":"nodejs","app.kubernetes.io/part-of":"new-application"},"name":"nodejs","namespace":"rorai"},"spec":{"port":{"targetPort":3000},"tls":{"insecureEdgeTerminationPolicy":"Redirect","termination":"edge"},"to":{"kind":"Service","name":"nodejs","weight":100}},"status":{}}\n',
        'openshift.io/host.generated': 'true',
      },
      creationTimestamp: '2022-05-16T09:52:33Z',
      labels: {
        'app.kubernetes.io/created-by': 'application-service',
        'app.kubernetes.io/instance': 'gitopsdepl-f56e3027-168b-43cf-aa3a-99d784d69b05',
        'app.kubernetes.io/managed-by': 'kustomize',
        'app.kubernetes.io/name': 'basic-node-js',
        'app.kubernetes.io/part-of': 'new-application',
      },
      name: 'nodejs',
      namespace: 'test',
      resourceVersion: '515569114',
      uid: '3d3e557d-34c8-4f1f-9a9b-9b199d96c6b3',
    },
    spec: {
      host: 'nodejs-test.apps.appstudio-stage.x99m.p1.openshiftapps.com',
      port: {
        targetPort: 3000,
      },
      tls: {
        insecureEdgeTerminationPolicy: 'Redirect',
        termination: 'edge',
      },
      to: {
        kind: 'Service',
        name: 'nodejs',
        weight: 100,
      },
      wildcardPolicy: 'None',
    },
    status: {
      ingress: [
        {
          conditions: [
            {
              lastTransitionTime: '2022-05-16T09:52:33Z',
              status: 'True',
              type: 'Admitted',
            },
          ],
          host: 'nodejs-test.apps.appstudio-stage.x99m.p1.openshiftapps.com',
          routerCanonicalHostname: 'router-default.apps.appstudio-stage.x99m.p1.openshiftapps.com',
          routerName: 'default',
          wildcardPolicy: 'None',
        },
      ],
    },
  },
  {
    apiVersion: 'route.openshift.io/v1',
    kind: 'Route',
    metadata: {
      annotations: {
        'kubectl.kubernetes.io/last-applied-configuration':
          '{"apiVersion":"route.openshift.io/v1","kind":"Route","metadata":{"annotations":{},"creationTimestamp":null,"labels":{"app.kubernetes.io/created-by":"application-service","app.kubernetes.io/instance":"gitopsdepl-3d00e628-1320-4e5e-b927-49329b9ca800","app.kubernetes.io/managed-by":"kustomize","app.kubernetes.io/name":"java-quarkus","app.kubernetes.io/part-of":"test-application"},"name":"java-quarkus","namespace":"rorai"},"spec":{"port":{"targetPort":8080},"tls":{"insecureEdgeTerminationPolicy":"Redirect","termination":"edge"},"to":{"kind":"Service","name":"java-quarkus","weight":100}},"status":{}}\n',
        'openshift.io/host.generated': 'true',
      },
      creationTimestamp: '2022-05-06T16:06:28Z',
      labels: {
        'app.kubernetes.io/created-by': 'application-service',
        'app.kubernetes.io/instance': 'gitopsdepl-3d00e628-1320-4e5e-b927-49329b9ca800',
        'app.kubernetes.io/managed-by': 'kustomize',
        'app.kubernetes.io/name': 'java-quarkus',
        'app.kubernetes.io/part-of': 'test-application',
      },
      name: 'java-quarkus',
      namespace: 'test',
      resourceVersion: '437696426',
      uid: '6f8cbe58-7274-4061-b68a-ed4d9afc57fd',
    },
    spec: {
      host: 'java-quarkus-test.apps.appstudio-stage.x99m.p1.openshiftapps.com',
      port: {
        targetPort: 8080,
      },
      tls: {
        insecureEdgeTerminationPolicy: 'Redirect',
        termination: 'edge',
      },
      to: {
        kind: 'Service',
        name: 'java-quarkus',
        weight: 100,
      },
      wildcardPolicy: 'None',
    },
    status: {
      ingress: [
        {
          conditions: [
            {
              lastTransitionTime: '2022-05-06T16:06:28Z',
              status: 'True',
              type: 'Admitted',
            },
          ],
          host: 'java-quarkus-test.apps.appstudio-stage.x99m.p1.openshiftapps.com',
          routerCanonicalHostname: 'router-default.apps.appstudio-stage.x99m.p1.openshiftapps.com',
          routerName: 'default',
          wildcardPolicy: 'None',
        },
      ],
    },
  },
];

export const mockGitOpsDeployment = [
  {
    apiVersion: 'managed-gitops.redhat.com/v1alpha1',
    kind: 'GitOpsDeployment',
    metadata: {
      creationTimestamp: '2022-06-01T14:00:56Z',
      generation: 1,
      labels: {
        'appstudio.application.name': 'application-to-test-git-ops',
      },
      name: 'application-to-test-git-ops-deployment',
      namespace: 'sbudhwar-1',
      ownerReferences: [
        {
          apiVersion: 'appstudio.redhat.com/v1alpha1',
          kind: 'Application',
          name: 'application-to-test-git-ops',
          uid: '1935564f-c9a0-4ed5-acea-22ce1315311c',
        },
      ],
      resourceVersion: '548372841',
      uid: '85fba8b1-a728-4aed-9d17-c874d14c512e',
    },
    spec: {
      destination: {},
      source: {
        path: './',
        repoURL:
          'https://github.com/redhat-appstudio-appdata/application-to-test-git-ops-sbudhwar-1-rise-stop',
      },
      type: 'automated',
    },
    status: {
      health: {
        status: 'Healthy',
      },
      sync: {
        status: 'Unknown',
      },
    },
  },
  {
    apiVersion: 'managed-gitops.redhat.com/v1alpha1',
    kind: 'GitOpsDeployment',
    metadata: {
      creationTimestamp: '2022-06-01T14:00:56Z',
      generation: 1,
      labels: {
        'appstudio.application.name': 'application-to-test',
      },
      name: 'application-to-test-deployment',
      namespace: 'sbudhwar-1',
      ownerReferences: [
        {
          apiVersion: 'appstudio.redhat.com/v1alpha1',
          kind: 'Application',
          name: 'application-to-test',
          uid: '1935564f-c9a0-4ed5-acea-22ce1315311c',
        },
      ],
      resourceVersion: '548372841',
      uid: '85fba8b1-a728-4aed-9d17-c874d14c512e',
    },
    spec: {
      destination: {},
      source: {
        path: './',
        repoURL:
          'https://github.com/redhat-appstudio-appdata/application-to-test-git-ops-sbudhwar-1-rise-stop',
      },
      type: 'automated',
    },
    status: {
      health: {
        status: 'Degraded',
      },
      sync: {
        status: 'Unknown',
      },
    },
  },
];

export const mockLimitRange: LimitRange = {
  apiVersion: 'v1',
  kind: 'LimitRange',
  metadata: { name: 'resource-limits' },
  spec: {
    limits: [
      {
        default: {
          cpu: '2',
          memory: '2Gi',
        },
        defaultRequest: {
          cpu: '10m',
          memory: '256Mi',
        },
        type: 'Container',
      },
    ],
  },
};

export const mockedServiceAccount: ServiceAccountKind = {
  kind: 'ServiceAccount',
  apiVersion: 'v1',
  metadata: {
    name: 'build-pipeline-c7814',
    namespace: 'rh-ee-rgalvao-tenant',
    uid: '1e50e721-a93d-41d4-8f3a-8da999c67d1c',
  },
  secrets: [
    {
      name: 'build-pipeline-c7814-dockercfg-bksxm',
    },
    {
      name: 'c7814-image-push',
    },
    {
      name: 'testing-new-secret',
    },
    {
      name: 'aha-new-test',
    },
  ],
  imagePullSecrets: [
    {
      name: 'build-pipeline-c7814-dockercfg-bksxm',
    },
    {
      name: 'testing-new-secret',
    },
    {
      name: 'aha-new-test',
    },
  ],
};

export const mockedSecret: SecretKind = {
  metadata: {
    name: 'a036c-image-pull',
    namespace: 'rh-ee-rgalvao-tenant',
    uid: 'bbb8afad-4043-4eba-93c3-bb51331e88cd',
    creationTimestamp: '2025-04-14T09:07:41Z',
    deletionTimestamp: '2025-04-17T12:55:26Z',
    labels: { 'appstudio.redhat.com/internal': 'true' },
  },
  type: 'kubernetes.io/dockerconfigjson',
  apiVersion: 'v1',
  kind: 'Secret',
};

export const mockedSecrets: SecretKind[] = [
  mockedSecret,
  {
    ...mockedSecret,
    metadata: { ...mockedSecret.metadata, name: 'a342f-image-pull', deletionTimestamp: undefined },
  },
  {
    ...mockedSecret,
    metadata: {
      ...mockedSecret.metadata,
      name: 'build-pipeline-c7814-dockercfg-bksxm',
      deletionTimestamp: undefined,
    },
  },
  {
    ...mockedSecret,
    metadata: {
      ...mockedSecret.metadata,
      name: 'build-pipeline-c7814-token-fbljb',
      deletionTimestamp: undefined,
    },
  },
];

// Banner Related
function formatTimeUTC(date: Date): string {
  const h = date.getUTCHours().toString().padStart(2, '0');
  const m = date.getUTCMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

const now = new Date();
const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
const oneHourEarlier = new Date(now.getTime() - 60 * 60 * 1000);
const halfHourEarlier = new Date(now.getTime() - 30 * 60 * 1000);

const futureStartTime = formatTimeUTC(oneHourLater);
const pastStartTime = formatTimeUTC(oneHourEarlier);
const pastEndTime = formatTimeUTC(halfHourEarlier);

const dayOfWeek = now.getUTCDay();
const dayOfMonth = now.getUTCDate();
const year = now.getUTCFullYear().toString();
const month = (now.getUTCMonth() + 1).toString();

// === YAML Banner Generator ===
function generateBannerYAML({
  type = 'info',
  summary = 'Default banner',
  repeatType,
  // eslint-disable-next-line @typescript-eslint/no-shadow
  dayOfWeek,
  // eslint-disable-next-line @typescript-eslint/no-shadow
  dayOfMonth,
  // eslint-disable-next-line @typescript-eslint/no-shadow
  year,
  // eslint-disable-next-line @typescript-eslint/no-shadow
  month,
  startTime,
  endTime,
}: {
  type?: string;
  summary?: string;
  repeatType?: 'weekly' | 'monthly' | 'none';
  dayOfWeek?: number;
  dayOfMonth?: number;
  year?: string;
  month?: string;
  startTime?: string;
  endTime?: string;
}) {
  const lines = [`type: ${type}`, `summary: ${summary}`];
  if (repeatType) {
    lines.push(`repeatType: ${repeatType}`);
    if (repeatType === 'weekly' && dayOfWeek !== undefined) {
      lines.push(`dayOfWeek: ${dayOfWeek}`);
    }
    if (repeatType === 'monthly' && dayOfMonth !== undefined) {
      lines.push(`dayOfMonth: ${dayOfMonth}`);
    }
    if (repeatType === 'none') {
      if (year !== undefined) lines.push(`year: ${year}`);
      if (month !== undefined) lines.push(`month: ${month}`);
      if (dayOfMonth !== undefined) lines.push(`dayOfMonth: ${dayOfMonth}`);
    }
  }
  if (startTime) lines.push(`startTime: "${startTime}"`);
  if (endTime) lines.push(`endTime: "${endTime}"`);
  return lines.join('\n');
}

export function generateBannerYAMLList(banners: ReturnType<typeof generateBannerYAML>[]): string {
  return yaml.dump(banners.map((b) => yaml.load(b)));
}

// === Base ConfigMap Template ===
const baseConfigMap = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: 'konflux-banner-configmap',
    namespace: 'konflux-info',
  },
};

// === Exported Mock Configs ===
export const mockedValidBannerConfig = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary:
          'This is a <strong>test banner</strong>. Free to check more details in [channel](https://test.com)',
        startTime: pastStartTime,
        endTime: '23:59',
      }),
    ]),
  },
};

export const mockedObsoletedBannerConfig = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'This is a <strong>test banner</strong>. Free to check more details in [channel]',
        repeatType: 'none',
        year,
        month,
        dayOfMonth,
        startTime: pastStartTime,
        endTime: pastEndTime,
      }),
    ]),
  },
};

export const mockedValidBannerConfigWithNoTimeRange = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'This is a test banner',
      }),
    ]),
  },
};

export const mockedInvalidBannerConfig = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': 'invalid yaml content',
  },
};

export const mockedOneTimeBannerConfigWithTime = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'One-time banner with time fields',
        repeatType: 'none',
        year,
        month,
        dayOfMonth,
        startTime: pastStartTime,
        endTime: '23:59',
      }),
    ]),
  },
};

// === Weekly Banners ===
export const mockedWeeklyBannerConfig = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'Weekly banner',
        repeatType: 'weekly',
        dayOfWeek,
        startTime: pastStartTime,
        endTime: '23:59',
      }),
    ]),
  },
};

export const mockedInvalidWeeklyBannerConfig = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'Weekly banner',
        repeatType: 'weekly',
        dayOfWeek: (dayOfWeek + 1) % 7, // tomorrow
        startTime: pastStartTime,
        endTime: '23:59',
      }),
    ]),
  },
};

// === Monthly Banners ===
export const mockedMonthlyBannerConfig = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'Monthly banner',
        repeatType: 'monthly',
        dayOfMonth,
        startTime: pastStartTime,
        endTime: '23:59',
      }),
    ]),
  },
};

export const mockedInvalidMonthlyBannerConfig = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'Monthly banner',
        repeatType: 'monthly',
        dayOfMonth: dayOfMonth + 1,
        startTime: '00:00',
        endTime: '23:59',
      }),
    ]),
  },
};

export const mockedValidMonthlyBannerConfigWithInvalidTimeRange = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'Monthly banner',
        repeatType: 'monthly',
        dayOfMonth: dayOfMonth + 1,
        startTime: futureStartTime,
        endTime: '23:59',
      }),
    ]),
  },
};

export const mockedObsoletedMonthlyBannerConfigWithTimeRange = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'Monthly banner',
        repeatType: 'monthly',
        dayOfMonth: dayOfMonth + 1,
        startTime: pastStartTime,
        endTime: pastEndTime,
      }),
    ]),
  },
};

export const mockedBannerListWithSeveralActive = {
  ...baseConfigMap,
  data: {
    'banner-content.yaml': generateBannerYAMLList([
      generateBannerYAML({
        summary: 'Inactive old banner',
        startTime: pastStartTime,
        endTime: pastEndTime,
      }),
      generateBannerYAML({
        summary: 'Active banner-1',
        startTime: pastStartTime,
        endTime: '23:59',
      }),
      generateBannerYAML({
        type: 'info',
        summary: 'Active banner-latest',
        startTime: pastStartTime,
        endTime: '23:59',
      }),
      generateBannerYAML({
        summary: 'Another inactive',
        repeatType: 'none',
        startTime: pastStartTime,
        endTime: pastEndTime,
      }),
    ]),
  },
};
