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
  // 36 warnings (including 8 policy-exception warnings for upcoming/volatile policy changes)
  // Policy-exception warnings — codes from UPCOMING_POLICY_CHANGE_CODES.
  {
    title: 'Policy rule is expiring soon',
    description:
      'A policy rule applied to this build is scheduled to expire and will be enforced as a violation after its effective date.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-08-10T00:00:00Z',
    component: 'frontend-service',
    msg: 'Rule "cve.critical_cve_found" expires on 2026-12-01 and will then be enforced.',
    solution: 'Address the underlying finding before the rule expiration date to avoid a future violation.',
    collection: ['minimal'],
    images: [CONTAINER_IMAGE_A],
    code: 'volatile_config.expiring_rule',
  },
  {
    title: 'Policy rule has expired',
    description:
      'A volatile policy rule exception has passed its expiration date and is no longer suppressing the associated finding.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-07-28T00:00:00Z',
    component: 'backend-api',
    msg: 'Exception for rule "attestation.slsa_provenance_level" expired on 2026-07-01.',
    solution: 'Renew the exception or remediate the finding so the build remains compliant.',
    collection: ['slsa3'],
    images: [CONTAINER_IMAGE_B],
    code: 'volatile_config.expired_rule',
  },
  {
    title: 'Invalid volatile policy configuration',
    description:
      'A volatile configuration entry for a policy rule is malformed and could not be fully applied.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-08-02T00:00:00Z',
    component: 'frontend-service',
    msg: 'Volatile config entry for "cve.unpatched_cve_warnings" is missing a valid effective_on date.',
    solution: 'Correct the volatile config entry so it specifies valid effective_on and expiry values.',
    collection: ['minimal', 'redhat'],
    images: [CONTAINER_IMAGE_A],
    code: 'volatile_config.invalid_config',
  },
  {
    title: 'Policy rule exception has no expiration',
    description:
      'A volatile policy exception was configured without an expiration date, so it will suppress the finding indefinitely.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-08-05T00:00:00Z',
    component: 'backend-api',
    msg: 'Exception for rule "base_image.allowed" has no expiration date set.',
    solution: 'Add an expiration date to the exception so it is periodically reviewed.',
    collection: ['slsa3'],
    images: [CONTAINER_IMAGE_B],
    code: 'volatile_config.no_expiration',
  },
  {
    title: 'Policy rule is pending activation',
    description:
      'A policy rule is configured with a future effective date and will begin to be enforced once that date is reached.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-08-12T00:00:00Z',
    component: 'database-migration',
    msg: 'Rule "hermetic.network_access" becomes effective on 2026-10-15.',
    solution: 'Prepare the build to satisfy the rule before its effective date.',
    collection: ['slsa3'],
    images: [CONTAINER_IMAGE_C],
    code: 'volatile_config.pending_rule',
  },
  {
    title: 'Policy rule is expiring soon',
    description:
      'A policy rule applied to this build is scheduled to expire and will be enforced as a violation after its effective date.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-08-18T00:00:00Z',
    component: 'backend-api',
    msg: 'Rule "sbom.missing" expires on 2026-11-15 and will then be enforced.',
    solution: 'Address the underlying finding before the rule expiration date to avoid a future violation.',
    collection: ['slsa3'],
    images: [CONTAINER_IMAGE_B],
    code: 'volatile_config.expiring_rule',
  },
  {
    title: 'Policy rule has expired',
    description:
      'A volatile policy rule exception has passed its expiration date and is no longer suppressing the associated finding.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-07-20T00:00:00Z',
    component: 'frontend-service',
    msg: 'Exception for rule "tasks.deprecated_api" expired on 2026-06-30.',
    solution: 'Renew the exception or remediate the finding so the build remains compliant.',
    collection: ['minimal'],
    images: [CONTAINER_IMAGE_A],
    code: 'volatile_config.expired_rule',
  },
  {
    title: 'Policy rule is pending activation',
    description:
      'A policy rule is configured with a future effective date and will begin to be enforced once that date is reached.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-08-22T00:00:00Z',
    component: 'frontend-service',
    msg: 'Rule "attestation.signature_check" becomes effective on 2026-10-01.',
    solution: 'Prepare the build to satisfy the rule before its effective date.',
    collection: ['minimal', 'slsa3'],
    images: [CONTAINER_IMAGE_A],
    code: 'volatile_config.pending_rule',
  },
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
  {
    title: 'Allowed base image registry prefixes list or signing identity was provided',
    description:
      'Confirm that either the `allowed_registry_prefixes` or a `signing_identities` entry was provided, since at least one is required by the policy rules in this package.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'frontend-service',
    msg: 'allowed_registry_prefixes is configured without signing_identities. Migrate to signature-based verification by setting signing_identities in rule data.',
    solution:
      'Make sure to configure either a signing identity under the `rh-release` key in the `signing_identities` https://conforma.dev/docs/cli/configuration.html#_data_sources or a list of trusted registry prefixes in `allowed_registry_prefixes`.',
    collection: ['minimal', 'redhat', 'policy_data', 'redhat_security'],
    images: [CONTAINER_IMAGE_A],
    code: 'base_image_registries.allowed_registries_provided',
  },
  {
    title: 'Non-blocking unpatched CVE check',
    description:
      'The SLSA Provenance attestation for the image is inspected to ensure CVEs that do NOT have a known fix and meet a certain security level have not been detected. If detected, this policy rule will raise a warning. By default, only CVEs of critical and high security level cause a warning. This is configurable by the rule data key `warn_unpatched_cve_security_levels`. The available levels are critical, high, medium, low, and unknown.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'frontend-service',
    msg: 'Found "CVE-2025-61729" non-blocking unpatched vulnerability of high security level',
    solution:
      'CVEs without a known fix can only be remediated by either removing the impacted dependency, or by waiting for a fix to be available.',
    collection: ['minimal', 'redhat'],
    images: [CONTAINER_IMAGE_A],
    code: 'cve.unpatched_cve_warnings',
  },
  {
    title: 'Non-blocking unpatched CVE check',
    description:
      'The SLSA Provenance attestation for the image is inspected to ensure CVEs that do NOT have a known fix and meet a certain security level have not been detected. If detected, this policy rule will raise a warning. By default, only CVEs of critical and high security level cause a warning. This is configurable by the rule data key `warn_unpatched_cve_security_levels`. The available levels are critical, high, medium, low, and unknown.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'frontend-service',
    msg: 'Found "CVE-2026-14456" non-blocking unpatched vulnerability of high security level',
    solution:
      'CVEs without a known fix can only be remediated by either removing the impacted dependency, or by waiting for a fix to be available.',
    collection: ['minimal', 'redhat'],
    images: [CONTAINER_IMAGE_A],
    code: 'cve.unpatched_cve_warnings',
  },
  {
    title: 'Non-blocking unpatched CVE check',
    description:
      'The SLSA Provenance attestation for the image is inspected to ensure CVEs that do NOT have a known fix and meet a certain security level have not been detected. If detected, this policy rule will raise a warning. By default, only CVEs of critical and high security level cause a warning. This is configurable by the rule data key `warn_unpatched_cve_security_levels`. The available levels are critical, high, medium, low, and unknown.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'backend-api',
    msg: 'Found "CVE-2026-21721" non-blocking unpatched vulnerability of high security level',
    solution:
      'CVEs without a known fix can only be remediated by either removing the impacted dependency, or by waiting for a fix to be available.',
    collection: ['minimal', 'redhat'],
    images: [CONTAINER_IMAGE_B],
    code: 'cve.unpatched_cve_warnings',
  },
  {
    title: 'Non-blocking unpatched CVE check',
    description:
      'The SLSA Provenance attestation for the image is inspected to ensure CVEs that do NOT have a known fix and meet a certain security level have not been detected. If detected, this policy rule will raise a warning. By default, only CVEs of critical and high security level cause a warning. This is configurable by the rule data key `warn_unpatched_cve_security_levels`. The available levels are critical, high, medium, low, and unknown.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'backend-api',
    msg: 'Found "CVE-2026-41178" non-blocking unpatched vulnerability of high security level',
    solution:
      'CVEs without a known fix can only be remediated by either removing the impacted dependency, or by waiting for a fix to be available.',
    collection: ['minimal', 'redhat'],
    images: [CONTAINER_IMAGE_B],
    code: 'cve.unpatched_cve_warnings',
  },
  {
    title: 'Non-blocking unpatched CVE check',
    description:
      'The SLSA Provenance attestation for the image is inspected to ensure CVEs that do NOT have a known fix and meet a certain security level have not been detected. If detected, this policy rule will raise a warning. By default, only CVEs of critical and high security level cause a warning. This is configurable by the rule data key `warn_unpatched_cve_security_levels`. The available levels are critical, high, medium, low, and unknown.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'backend-api',
    msg: 'Found "CVE-2026-48586" non-blocking unpatched vulnerability of high security level',
    solution:
      'CVEs without a known fix can only be remediated by either removing the impacted dependency, or by waiting for a fix to be available.',
    collection: ['minimal', 'redhat'],
    images: [CONTAINER_IMAGE_B],
    code: 'cve.unpatched_cve_warnings',
  },
  {
    title: 'Non-blocking unpatched CVE check',
    description:
      'The SLSA Provenance attestation for the image is inspected to ensure CVEs that do NOT have a known fix and meet a certain security level have not been detected. If detected, this policy rule will raise a warning. By default, only CVEs of critical and high security level cause a warning. This is configurable by the rule data key `warn_unpatched_cve_security_levels`. The available levels are critical, high, medium, low, and unknown.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'database-migration',
    msg: 'Found "CVE-2026-53613" non-blocking unpatched vulnerability of high security level',
    solution:
      'CVEs without a known fix can only be remediated by either removing the impacted dependency, or by waiting for a fix to be available.',
    collection: ['minimal', 'redhat'],
    images: [CONTAINER_IMAGE_C],
    code: 'cve.unpatched_cve_warnings',
  },
  {
    title: 'Non-blocking unpatched CVE check',
    description:
      'The SLSA Provenance attestation for the image is inspected to ensure CVEs that do NOT have a known fix and meet a certain security level have not been detected. If detected, this policy rule will raise a warning. By default, only CVEs of critical and high security level cause a warning. This is configurable by the rule data key `warn_unpatched_cve_security_levels`. The available levels are critical, high, medium, low, and unknown.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'database-migration',
    msg: 'Found "CVE-2026-73500" non-blocking unpatched vulnerability of high security level',
    solution:
      'CVEs without a known fix can only be remediated by either removing the impacted dependency, or by waiting for a fix to be available.',
    collection: ['minimal', 'redhat'],
    images: [CONTAINER_IMAGE_C],
    code: 'cve.unpatched_cve_warnings',
  },
  {
    title: 'Non-blocking unpatched CVE check',
    description:
      'The SLSA Provenance attestation for the image is inspected to ensure CVEs that do NOT have a known fix and meet a certain security level have not been detected. If detected, this policy rule will raise a warning. By default, only CVEs of critical and high security level cause a warning. This is configurable by the rule data key `warn_unpatched_cve_security_levels`. The available levels are critical, high, medium, low, and unknown.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'frontend-service',
    msg: 'Found "CVE-2026-8458" non-blocking unpatched vulnerability of high security level',
    solution:
      'CVEs without a known fix can only be remediated by either removing the impacted dependency, or by waiting for a fix to be available.',
    collection: ['minimal', 'redhat'],
    images: [CONTAINER_IMAGE_A],
    code: 'cve.unpatched_cve_warnings',
  },
  {
    title: 'Non-blocking unpatched CVE check',
    description:
      'The SLSA Provenance attestation for the image is inspected to ensure CVEs that do NOT have a known fix and meet a certain security level have not been detected. If detected, this policy rule will raise a warning. By default, only CVEs of critical and high security level cause a warning. This is configurable by the rule data key `warn_unpatched_cve_security_levels`. The available levels are critical, high, medium, low, and unknown.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'frontend-service',
    msg: 'Found "CVE-2026-8927" non-blocking unpatched vulnerability of high security level',
    solution:
      'CVEs without a known fix can only be remediated by either removing the impacted dependency, or by waiting for a fix to be available.',
    collection: ['minimal', 'redhat'],
    images: [CONTAINER_IMAGE_A],
    code: 'cve.unpatched_cve_warnings',
  },
  {
    title: 'Non-blocking unpatched CVE check',
    description:
      'The SLSA Provenance attestation for the image is inspected to ensure CVEs that do NOT have a known fix and meet a certain security level have not been detected. If detected, this policy rule will raise a warning. By default, only CVEs of critical and high security level cause a warning. This is configurable by the rule data key `warn_unpatched_cve_security_levels`. The available levels are critical, high, medium, low, and unknown.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'backend-api',
    msg: 'Found "GHSA-rg2x-37c3-w2rh" non-blocking unpatched vulnerability of high security level',
    solution:
      'CVEs without a known fix can only be remediated by either removing the impacted dependency, or by waiting for a fix to be available.',
    collection: ['minimal', 'redhat'],
    images: [CONTAINER_IMAGE_B],
    code: 'cve.unpatched_cve_warnings',
  },
  {
    title: 'Non-blocking unpatched CVE check',
    description:
      'The SLSA Provenance attestation for the image is inspected to ensure CVEs that do NOT have a known fix and meet a certain security level have not been detected. If detected, this policy rule will raise a warning. By default, only CVEs of critical and high security level cause a warning. This is configurable by the rule data key `warn_unpatched_cve_security_levels`. The available levels are critical, high, medium, low, and unknown.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'backend-api',
    msg: 'Found "GHSA-x86f-5xw2-fm2r" non-blocking unpatched vulnerability of high security level',
    solution:
      'CVEs without a known fix can only be remediated by either removing the impacted dependency, or by waiting for a fix to be available.',
    collection: ['minimal', 'redhat'],
    images: [CONTAINER_IMAGE_B],
    code: 'cve.unpatched_cve_warnings',
  },
  {
    title: 'Hermeto attribution required',
    description:
      'Registry dependencies with a PURL type listed in vendored_purl_types must be processed by Hermeto. When a hermetic build omits prefetch-input for a vendored ecosystem, Hermeto never runs and the SBOM contains only Syft-reported module-level data, which is insufficient for CVE analysis. This rule denies any such package that lacks the hermeto:found_by (or cachi2:found_by) annotation.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-10-01T00:00:00Z',
    component: 'frontend-service',
    msg: 'Package pkg:golang/github.com/blang/semver@v3.5.1%2Bincompatible has PURL type "golang" which requires Hermeto attribution but was not processed by Hermeto. This will become a failure starting on 2026-10-01T00:00:00Z',
    solution:
      'Set the prefetch-input pipeline parameter to the Hermeto package manager name for the ecosystem (e.g. "gomod" for pkg:golang, "cargo" for pkg:cargo) so Hermeto processes the project\'s dependencies during the prefetch-dependencies task.',
    collection: ['redhat', 'policy_data', 'redhat_security'],
    images: [CONTAINER_IMAGE_A],
    code: 'sbom_spdx.hermeto_attribution_required',
  },
  {
    title: 'Hermeto attribution required',
    description:
      'Registry dependencies with a PURL type listed in vendored_purl_types must be processed by Hermeto. When a hermetic build omits prefetch-input for a vendored ecosystem, Hermeto never runs and the SBOM contains only Syft-reported module-level data, which is insufficient for CVE analysis. This rule denies any such package that lacks the hermeto:found_by (or cachi2:found_by) annotation.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-10-01T00:00:00Z',
    component: 'frontend-service',
    msg: 'Package pkg:golang/github.com/go-sourcemap/sourcemap@v2.1.4%2Bincompatible has PURL type "golang" which requires Hermeto attribution but was not processed by Hermeto. This will become a failure starting on 2026-10-01T00:00:00Z',
    solution:
      'Set the prefetch-input pipeline parameter to the Hermeto package manager name for the ecosystem (e.g. "gomod" for pkg:golang, "cargo" for pkg:cargo) so Hermeto processes the project\'s dependencies during the prefetch-dependencies task.',
    collection: ['redhat', 'policy_data', 'redhat_security'],
    images: [CONTAINER_IMAGE_A],
    code: 'sbom_spdx.hermeto_attribution_required',
  },
  {
    title: 'Hermeto attribution required',
    description:
      'Registry dependencies with a PURL type listed in vendored_purl_types must be processed by Hermeto. When a hermetic build omits prefetch-input for a vendored ecosystem, Hermeto never runs and the SBOM contains only Syft-reported module-level data, which is insufficient for CVE analysis. This rule denies any such package that lacks the hermeto:found_by (or cachi2:found_by) annotation.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-10-01T00:00:00Z',
    component: 'backend-api',
    msg: 'Package pkg:golang/github.com/gofrs/uuid@v4.4.0%2Bincompatible has PURL type "golang" which requires Hermeto attribution but was not processed by Hermeto. This will become a failure starting on 2026-10-01T00:00:00Z',
    solution:
      'Set the prefetch-input pipeline parameter to the Hermeto package manager name for the ecosystem (e.g. "gomod" for pkg:golang, "cargo" for pkg:cargo) so Hermeto processes the project\'s dependencies during the prefetch-dependencies task.',
    collection: ['redhat', 'policy_data', 'redhat_security'],
    images: [CONTAINER_IMAGE_B],
    code: 'sbom_spdx.hermeto_attribution_required',
  },
  {
    title: 'Hermeto attribution required',
    description:
      'Registry dependencies with a PURL type listed in vendored_purl_types must be processed by Hermeto. When a hermetic build omits prefetch-input for a vendored ecosystem, Hermeto never runs and the SBOM contains only Syft-reported module-level data, which is insufficient for CVE analysis. This rule denies any such package that lacks the hermeto:found_by (or cachi2:found_by) annotation.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-10-01T00:00:00Z',
    component: 'backend-api',
    msg: 'Package pkg:golang/github.com/google/flatbuffers@v25.12.19%2Bincompatible has PURL type "golang" which requires Hermeto attribution but was not processed by Hermeto. This will become a failure starting on 2026-10-01T00:00:00Z',
    solution:
      'Set the prefetch-input pipeline parameter to the Hermeto package manager name for the ecosystem (e.g. "gomod" for pkg:golang, "cargo" for pkg:cargo) so Hermeto processes the project\'s dependencies during the prefetch-dependencies task.',
    collection: ['redhat', 'policy_data', 'redhat_security'],
    images: [CONTAINER_IMAGE_B],
    code: 'sbom_spdx.hermeto_attribution_required',
  },
  {
    title: 'Hermeto attribution required',
    description:
      'Registry dependencies with a PURL type listed in vendored_purl_types must be processed by Hermeto. When a hermetic build omits prefetch-input for a vendored ecosystem, Hermeto never runs and the SBOM contains only Syft-reported module-level data, which is insufficient for CVE analysis. This rule denies any such package that lacks the hermeto:found_by (or cachi2:found_by) annotation.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-10-01T00:00:00Z',
    component: 'backend-api',
    msg: 'Package pkg:golang/github.com/grafana/grafana@v12.4.0 has PURL type "golang" which requires Hermeto attribution but was not processed by Hermeto. This will become a failure starting on 2026-10-01T00:00:00Z',
    solution:
      'Set the prefetch-input pipeline parameter to the Hermeto package manager name for the ecosystem (e.g. "gomod" for pkg:golang, "cargo" for pkg:cargo) so Hermeto processes the project\'s dependencies during the prefetch-dependencies task.',
    collection: ['redhat', 'policy_data', 'redhat_security'],
    images: [CONTAINER_IMAGE_B],
    code: 'sbom_spdx.hermeto_attribution_required',
  },
  {
    title: 'Hermeto attribution required',
    description:
      'Registry dependencies with a PURL type listed in vendored_purl_types must be processed by Hermeto. When a hermetic build omits prefetch-input for a vendored ecosystem, Hermeto never runs and the SBOM contains only Syft-reported module-level data, which is insufficient for CVE analysis. This rule denies any such package that lacks the hermeto:found_by (or cachi2:found_by) annotation.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-10-01T00:00:00Z',
    component: 'database-migration',
    msg: 'Package pkg:golang/github.com/moby/moby@v28.0.1%2Bincompatible has PURL type "golang" which requires Hermeto attribution but was not processed by Hermeto. This will become a failure starting on 2026-10-01T00:00:00Z',
    solution:
      'Set the prefetch-input pipeline parameter to the Hermeto package manager name for the ecosystem (e.g. "gomod" for pkg:golang, "cargo" for pkg:cargo) so Hermeto processes the project\'s dependencies during the prefetch-dependencies task.',
    collection: ['redhat', 'policy_data', 'redhat_security'],
    images: [CONTAINER_IMAGE_C],
    code: 'sbom_spdx.hermeto_attribution_required',
  },
  {
    title: 'Hermeto attribution required',
    description:
      'Registry dependencies with a PURL type listed in vendored_purl_types must be processed by Hermeto. When a hermetic build omits prefetch-input for a vendored ecosystem, Hermeto never runs and the SBOM contains only Syft-reported module-level data, which is insufficient for CVE analysis. This rule denies any such package that lacks the hermeto:found_by (or cachi2:found_by) annotation.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-10-01T00:00:00Z',
    component: 'database-migration',
    msg: 'Package pkg:golang/github.com/patrickmn/go-cache@v2.1.0%2Bincompatible has PURL type "golang" which requires Hermeto attribution but was not processed by Hermeto. This will become a failure starting on 2026-10-01T00:00:00Z',
    solution:
      'Set the prefetch-input pipeline parameter to the Hermeto package manager name for the ecosystem (e.g. "gomod" for pkg:golang, "cargo" for pkg:cargo) so Hermeto processes the project\'s dependencies during the prefetch-dependencies task.',
    collection: ['redhat', 'policy_data', 'redhat_security'],
    images: [CONTAINER_IMAGE_C],
    code: 'sbom_spdx.hermeto_attribution_required',
  },
  {
    title: 'Hermeto attribution required',
    description:
      'Registry dependencies with a PURL type listed in vendored_purl_types must be processed by Hermeto. When a hermetic build omits prefetch-input for a vendored ecosystem, Hermeto never runs and the SBOM contains only Syft-reported module-level data, which is insufficient for CVE analysis. This rule denies any such package that lacks the hermeto:found_by (or cachi2:found_by) annotation.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-10-01T00:00:00Z',
    component: 'frontend-service',
    msg: 'Package pkg:golang/github.com/uber/jaeger-client-go@v2.30.0%2Bincompatible has PURL type "golang" which requires Hermeto attribution but was not processed by Hermeto. This will become a failure starting on 2026-10-01T00:00:00Z',
    solution:
      'Set the prefetch-input pipeline parameter to the Hermeto package manager name for the ecosystem (e.g. "gomod" for pkg:golang, "cargo" for pkg:cargo) so Hermeto processes the project\'s dependencies during the prefetch-dependencies task.',
    collection: ['redhat', 'policy_data', 'redhat_security'],
    images: [CONTAINER_IMAGE_A],
    code: 'sbom_spdx.hermeto_attribution_required',
  },
  {
    title: 'Hermeto attribution required',
    description:
      'Registry dependencies with a PURL type listed in vendored_purl_types must be processed by Hermeto. When a hermetic build omits prefetch-input for a vendored ecosystem, Hermeto never runs and the SBOM contains only Syft-reported module-level data, which is insufficient for CVE analysis. This rule denies any such package that lacks the hermeto:found_by (or cachi2:found_by) annotation.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-10-01T00:00:00Z',
    component: 'frontend-service',
    msg: 'Package pkg:golang/github.com/uber/jaeger-lib@v2.4.1%2Bincompatible has PURL type "golang" which requires Hermeto attribution but was not processed by Hermeto. This will become a failure starting on 2026-10-01T00:00:00Z',
    solution:
      'Set the prefetch-input pipeline parameter to the Hermeto package manager name for the ecosystem (e.g. "gomod" for pkg:golang, "cargo" for pkg:cargo) so Hermeto processes the project\'s dependencies during the prefetch-dependencies task.',
    collection: ['redhat', 'policy_data', 'redhat_security'],
    images: [CONTAINER_IMAGE_A],
    code: 'sbom_spdx.hermeto_attribution_required',
  },
  {
    title: 'Hermeto attribution required',
    description:
      'Registry dependencies with a PURL type listed in vendored_purl_types must be processed by Hermeto. When a hermetic build omits prefetch-input for a vendored ecosystem, Hermeto never runs and the SBOM contains only Syft-reported module-level data, which is insufficient for CVE analysis. This rule denies any such package that lacks the hermeto:found_by (or cachi2:found_by) annotation.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: '2026-10-01T00:00:00Z',
    component: 'backend-api',
    msg: 'Package pkg:golang/stdlib@1.26.5 has PURL type "golang" which requires Hermeto attribution but was not processed by Hermeto. This will become a failure starting on 2026-10-01T00:00:00Z',
    solution:
      'Set the prefetch-input pipeline parameter to the Hermeto package manager name for the ecosystem (e.g. "gomod" for pkg:golang, "cargo" for pkg:cargo) so Hermeto processes the project\'s dependencies during the prefetch-dependencies task.',
    collection: ['redhat', 'policy_data', 'redhat_security'],
    images: [CONTAINER_IMAGE_B],
    code: 'sbom_spdx.hermeto_attribution_required',
  },
  {
    title: 'No informative tests failed',
    description:
      'Produce a warning if any informative tests have their result set to "FAILED". The result type is configurable by the "failed_tests_results" key, and the list of informative tests is configurable by the "informative_tests" key in the rule data.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'frontend-service',
    msg: 'The Task "ecosystem-cert-preflight-checks" from the build Pipeline reports a failed informative test',
    solution:
      'There is a test that failed. Make sure that any task in the build pipeline with a result named \'TEST_OUTPUT\' does not fail. More information about the test should be available in the logs for the build Pipeline.',
    collection: ['redhat'],
    images: [CONTAINER_IMAGE_A],
    code: 'test.no_failed_informative_tests',
  },
  {
    title: 'No informative tests failed',
    description:
      'Produce a warning if any informative tests have their result set to "FAILED". The result type is configurable by the "failed_tests_results" key, and the list of informative tests is configurable by the "informative_tests" key in the rule data.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'backend-api',
    msg: 'The Task "sast-shell-check-oci-ta" from the build Pipeline reports a failed informative test',
    solution:
      'There is a test that failed. Make sure that any task in the build pipeline with a result named \'TEST_OUTPUT\' does not fail. More information about the test should be available in the logs for the build Pipeline.',
    collection: ['redhat'],
    images: [CONTAINER_IMAGE_B],
    code: 'test.no_failed_informative_tests',
  },
  {
    title: 'No informative tests failed',
    description:
      'Produce a warning if any informative tests have their result set to "FAILED". The result type is configurable by the "failed_tests_results" key, and the list of informative tests is configurable by the "informative_tests" key in the rule data.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'backend-api',
    msg: 'The Task "sast-snyk-check-oci-ta" from the build Pipeline reports a failed informative test',
    solution:
      'There is a test that failed. Make sure that any task in the build pipeline with a result named \'TEST_OUTPUT\' does not fail. More information about the test should be available in the logs for the build Pipeline.',
    collection: ['redhat'],
    images: [CONTAINER_IMAGE_B],
    code: 'test.no_failed_informative_tests',
  },
  {
    title: 'No tests produced warnings',
    description:
      'Produce a warning if any tests have their result set to "WARNING". The result type is configurable by the "warned_tests_results" key in the rule data.',
    status: CONFORMA_RESULT_STATUS.warnings,
    timestamp: undefined,
    component: 'database-migration',
    msg: 'The Task "deprecated-image-check" from the build Pipeline reports a test contains warnings',
    solution:
      'There is a task with result \'TEST_OUTPUT\' that returned a result of \'WARNING\'. You can find which test resulted in \'WARNING\' by examining the \'result\' key in the \'TEST_OUTPUT\'. More information about the test should be available in the logs for the build Pipeline.',
    collection: ['redhat'],
    images: [CONTAINER_IMAGE_C],
    code: 'test.no_test_warnings',
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
  _applicationName: string, // eslint-disable-line @typescript-eslint/no-unused-vars
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
