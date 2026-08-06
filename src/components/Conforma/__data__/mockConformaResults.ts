import type { ApplicationConformaResults, ComponentConformaStatus } from '~/types/conforma';
import {
  ComponentConformaResult,
  CONFORMA_RESULT_STATUS,
  ConformaResultRow,
} from '~/types/conforma';

const CONTAINER_IMAGE_A =
  'quay.io/redhat-appstudio/user-workload@sha256:aaa111222333444555666777888999000aaabbbcccdddeeefff0001112223334';
const CONTAINER_IMAGE_B =
  'quay.io/redhat-appstudio/user-workload@sha256:bbb111222333444555666777888999000aaabbbcccdddeeefff0001112223334';
const CONTAINER_IMAGE_C =
  'quay.io/redhat-appstudio/user-workload@sha256:ccc111222333444555666777888999000aaabbbcccdddeeefff0001112223334';

export const mockConformaComponentResults: ComponentConformaResult[] = [
  {
    containerImage: CONTAINER_IMAGE_A,
    name: 'frontend-service',
    success: false,
    violations: [
      {
        metadata: {
          title: 'Missing CVE scan results',
          description:
            'The clair-scan task results have not been found in the SLSA Provenance attestation of the build pipeline.',
          collections: ['minimal'],
          code: 'cve.missing_cve_scan_results',
          ['effective_on']: '2022-01-01T00:00:00Z',
          solution: 'Ensure the clair-scan task is included in the build pipeline.',
        },
        msg: 'CVE scan results not found',
      },
      {
        metadata: {
          title: 'Unsigned image',
          description: 'The container image is not signed with a valid signature.',
          collections: ['minimal', 'slsa3'],
          code: 'attestation.signature_check',
          ['effective_on']: '2023-06-01T00:00:00Z',
          solution: 'Sign the image using cosign or Tekton Chains.',
        },
        msg: 'Image signature verification failed',
      },
      {
        metadata: {
          title: 'Disallowed base image',
          description: 'The base image used in the build is not from an approved registry.',
          collections: ['slsa3'],
          code: 'base_image.allowed',
          ['effective_on']: '2023-01-15T00:00:00Z',
          solution: 'Use a base image from an approved registry such as registry.redhat.io.',
        },
        msg: 'Base image registry.example.com/untrusted/base:latest is not allowed',
      },
    ],
    warnings: [
      {
        metadata: {
          title: 'Deprecated API usage',
          description:
            'The task uses a deprecated Tekton API version that will be removed in a future release.',
          collections: ['minimal'],
          code: 'tasks.deprecated_api',
          ['effective_on']: '2026-08-06T00:00:00Z',
          solution: 'Migrate tasks to tekton.dev/v1 API version.',
        },
        msg: 'Task uses tekton.dev/v1beta1 which is deprecated',
      },
      {
        metadata: {
          title: 'Missing SBOM',
          description:
            'A Software Bill of Materials was not found attached to the image attestation.',
          collections: ['slsa3'],
          code: 'sbom.missing',
          ['effective_on']: '2026-09-15T00:00:00Z',
          solution: 'Ensure the SBOM generation task is part of the build pipeline.',
        },
        msg: 'No SBOM found for the image',
      },
    ],
    successes: [
      {
        metadata: {
          title: 'Tasks run successfully',
          description:
            'This policy enforces that at least one Task is present in the PipelineRun attestation.',
          collections: ['minimal'],
          code: 'tasks.tasks_missing',
        },
        msg: 'Pass',
      },
      {
        metadata: {
          title: 'Provenance materials present',
          description:
            'The SLSA Provenance attestation includes the expected list of build materials.',
          collections: ['minimal', 'slsa3'],
          code: 'attestation.provenance_materials',
        },
        msg: 'Pass',
      },
    ],
  },
  {
    containerImage: CONTAINER_IMAGE_B,
    name: 'backend-api',
    success: false,
    violations: [
      {
        metadata: {
          title: 'Critical CVE found',
          description:
            'A critical-severity CVE was detected in the image and must be remediated before release.',
          collections: ['minimal', 'slsa3'],
          code: 'cve.critical_cve_found',
          ['effective_on']: '2023-03-01T00:00:00Z',
          solution: 'Update the affected package to a version that resolves CVE-2024-12345.',
        },
        msg: 'Critical CVE-2024-12345 found in openssl-3.0.2',
      },
      {
        metadata: {
          title: 'SLSA provenance not met',
          description:
            'The build pipeline does not meet the required SLSA provenance level for release.',
          collections: ['slsa3'],
          code: 'attestation.slsa_provenance_level',
          ['effective_on']: '2023-09-01T00:00:00Z',
          solution: 'Ensure the pipeline is configured to produce SLSA Level 3 provenance.',
        },
        msg: 'Expected SLSA Level 3 provenance but found Level 1',
      },
    ],
    warnings: [
      {
        metadata: {
          title: 'Non-hermetic build detected',
          description:
            'The build process made network calls during execution, which may affect reproducibility.',
          collections: ['slsa3'],
          code: 'hermetic.network_access',
          ['effective_on']: '2026-08-20T00:00:00Z',
          solution: 'Configure the build to run in a hermetic environment.',
        },
        msg: 'Network access detected during build step',
      },
    ],
    successes: [
      {
        metadata: {
          title: 'Image labels present',
          description: 'The container image includes all required OCI labels for traceability.',
          collections: ['minimal'],
          code: 'labels.required_labels',
        },
        msg: 'Pass',
      },
      {
        metadata: {
          title: 'Allowed task bundles',
          description: 'All tasks in the pipeline are from approved task bundle references.',
          collections: ['minimal', 'slsa3'],
          code: 'tasks.allowed_task_bundles',
        },
        msg: 'Pass',
      },
      {
        metadata: {
          title: 'Test results found',
          description:
            'Test results from the build pipeline were found and evaluated successfully.',
          collections: ['minimal'],
          code: 'test.test_results_found',
        },
        msg: 'Pass',
      },
    ],
  },
  {
    containerImage: CONTAINER_IMAGE_C,
    name: 'database-migration',
    success: true,
    successes: [
      {
        metadata: {
          title: 'Tasks run successfully',
          description:
            'This policy enforces that at least one Task is present in the PipelineRun attestation.',
          collections: ['minimal'],
          code: 'tasks.tasks_missing',
        },
        msg: 'Pass',
      },
      {
        metadata: {
          title: 'Provenance materials present',
          description:
            'The SLSA Provenance attestation includes the expected list of build materials.',
          collections: ['minimal', 'slsa3'],
          code: 'attestation.provenance_materials',
        },
        msg: 'Pass',
      },
    ],
  },
];

export const mockConformaUIDataMixed: ConformaResultRow[] = [
  // 5 violations
  {
    title: 'Missing CVE scan results',
    description:
      'The clair-scan task results have not been found in the SLSA Provenance attestation of the build pipeline.',
    status: CONFORMA_RESULT_STATUS.violations,
    timestamp: '2022-01-01T00:00:00Z',
    component: 'frontend-service',
    msg: 'CVE scan results not found',
    solution: 'Ensure the clair-scan task is included in the build pipeline.',
    collection: ['minimal'],
    images: [CONTAINER_IMAGE_A],
    code: 'cve.missing_cve_scan_results',
  },
  {
    title: 'Unsigned image',
    description: 'The container image is not signed with a valid signature.',
    status: CONFORMA_RESULT_STATUS.violations,
    timestamp: '2023-06-01T00:00:00Z',
    component: 'frontend-service',
    msg: 'Image signature verification failed',
    solution: 'Sign the image using cosign or Tekton Chains.',
    collection: ['minimal', 'slsa3'],
    images: [CONTAINER_IMAGE_A],
    code: 'attestation.signature_check',
  },
  {
    title: 'Disallowed base image',
    description: 'The base image used in the build is not from an approved registry.',
    status: CONFORMA_RESULT_STATUS.violations,
    timestamp: '2023-01-15T00:00:00Z',
    component: 'frontend-service',
    msg: 'Base image registry.example.com/untrusted/base:latest is not allowed',
    solution: 'Use a base image from an approved registry such as registry.redhat.io.',
    collection: ['slsa3'],
    images: [CONTAINER_IMAGE_A],
    code: 'base_image.allowed',
  },
  {
    title: 'Critical CVE found',
    description:
      'A critical-severity CVE was detected in the image and must be remediated before release.',
    status: CONFORMA_RESULT_STATUS.violations,
    timestamp: '2023-03-01T00:00:00Z',
    component: 'backend-api',
    msg: 'Critical CVE-2024-12345 found in openssl-3.0.2',
    solution: 'Update the affected package to a version that resolves CVE-2024-12345.',
    collection: ['minimal', 'slsa3'],
    images: [CONTAINER_IMAGE_B],
    code: 'cve.critical_cve_found',
  },
  {
    title: 'SLSA provenance not met',
    description: 'The build pipeline does not meet the required SLSA provenance level for release.',
    status: CONFORMA_RESULT_STATUS.violations,
    timestamp: '2023-09-01T00:00:00Z',
    component: 'backend-api',
    msg: 'Expected SLSA Level 3 provenance but found Level 1',
    solution: 'Ensure the pipeline is configured to produce SLSA Level 3 provenance.',
    collection: ['slsa3'],
    images: [CONTAINER_IMAGE_B],
    code: 'attestation.slsa_provenance_level',
  },
  // 3 warnings
  {
    title: 'Deprecated API usage',
    description:
      'The task uses a deprecated Tekton API version that will be removed in a future release.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-08-06T00:00:00Z',
    component: 'frontend-service',
    msg: 'Task uses tekton.dev/v1beta1 which is deprecated',
    solution: 'Migrate tasks to tekton.dev/v1 API version.',
    collection: ['minimal'],
    images: [CONTAINER_IMAGE_A],
    code: 'tasks.deprecated_api',
  },
  {
    title: 'Missing SBOM',
    description: 'A Software Bill of Materials was not found attached to the image attestation.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-09-15T00:00:00Z',
    component: 'frontend-service',
    msg: 'No SBOM found for the image',
    solution: 'Ensure the SBOM generation task is part of the build pipeline.',
    collection: ['slsa3'],
    images: [CONTAINER_IMAGE_A],
    code: 'sbom.missing',
  },
  {
    title: 'Non-hermetic build detected',
    description:
      'The build process made network calls during execution, which may affect reproducibility.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-08-20T00:00:00Z',
    component: 'backend-api',
    msg: 'Network access detected during build step',
    solution: 'Configure the build to run in a hermetic environment.',
    collection: ['slsa3'],
    images: [CONTAINER_IMAGE_B],
    code: 'hermetic.network_access',
  },
  // 7 successes
  {
    title: 'Tasks run successfully',
    description:
      'This policy enforces that at least one Task is present in the PipelineRun attestation.',
    status: CONFORMA_RESULT_STATUS.successes,
    timestamp: undefined,
    component: 'frontend-service',
    msg: 'Pass',
    solution: undefined,
    collection: ['minimal'],
    images: [CONTAINER_IMAGE_A],
    code: 'tasks.tasks_missing',
  },
  {
    title: 'Provenance materials present',
    description: 'The SLSA Provenance attestation includes the expected list of build materials.',
    status: CONFORMA_RESULT_STATUS.successes,
    timestamp: undefined,
    component: 'frontend-service',
    msg: 'Pass',
    solution: undefined,
    collection: ['minimal', 'slsa3'],
    images: [CONTAINER_IMAGE_A],
    code: 'attestation.provenance_materials',
  },
  {
    title: 'Image labels present',
    description: 'The container image includes all required OCI labels for traceability.',
    status: CONFORMA_RESULT_STATUS.successes,
    timestamp: undefined,
    component: 'backend-api',
    msg: 'Pass',
    solution: undefined,
    collection: ['minimal'],
    images: [CONTAINER_IMAGE_B],
    code: 'labels.required_labels',
  },
  {
    title: 'Allowed task bundles',
    description: 'All tasks in the pipeline are from approved task bundle references.',
    status: CONFORMA_RESULT_STATUS.successes,
    timestamp: undefined,
    component: 'backend-api',
    msg: 'Pass',
    solution: undefined,
    collection: ['minimal', 'slsa3'],
    images: [CONTAINER_IMAGE_B],
    code: 'tasks.allowed_task_bundles',
  },
  {
    title: 'Test results found',
    description: 'Test results from the build pipeline were found and evaluated successfully.',
    status: CONFORMA_RESULT_STATUS.successes,
    timestamp: undefined,
    component: 'backend-api',
    msg: 'Pass',
    solution: undefined,
    collection: ['minimal'],
    images: [CONTAINER_IMAGE_B],
    code: 'test.test_results_found',
  },
  {
    title: 'Tasks run successfully',
    description:
      'This policy enforces that at least one Task is present in the PipelineRun attestation.',
    status: CONFORMA_RESULT_STATUS.successes,
    timestamp: undefined,
    component: 'database-migration',
    msg: 'Pass',
    solution: undefined,
    collection: ['minimal'],
    images: [CONTAINER_IMAGE_C],
    code: 'tasks.tasks_missing',
  },
  {
    title: 'Provenance materials present',
    description: 'The SLSA Provenance attestation includes the expected list of build materials.',
    status: CONFORMA_RESULT_STATUS.successes,
    timestamp: undefined,
    component: 'database-migration',
    msg: 'Pass',
    solution: undefined,
    collection: ['minimal', 'slsa3'],
    images: [CONTAINER_IMAGE_C],
    code: 'attestation.provenance_materials',
  },
];

const mockComponentStatuses: ComponentConformaStatus[] = mockConformaComponentResults.map((c) => {
  const violationCount = c.violations?.length ?? 0;
  const warningCount = c.warnings?.length ?? 0;
  const successCount = c.successes?.length ?? 0;

  let status: ComponentConformaStatus['status'] = 'unknown';
  if (violationCount > 0) status = 'fail';
  else if (warningCount > 0) status = 'warning';
  else if (successCount > 0) status = 'pass';

  return {
    componentName: c.name,
    status,
    violationCount,
    warningCount,
    successCount,
    pipelineRunName: `mock-pipeline-run-${c.name}`,
  };
});

export const useMockApplicationConformaResults = (
  _applicationName: string,
): ApplicationConformaResults => ({
  componentStatuses: mockComponentStatuses,
  allResults: mockConformaUIDataMixed,
  totalComponents: mockComponentStatuses.length,
  totalFailed: mockComponentStatuses.filter((c) => c.status === 'fail').length,
  loaded: true,
  settling: false,
  error: undefined,
  refresh: {
    lastFetchedAt: 0,
    isRefreshing: false,
    onRefresh: () => {},
  },
});
