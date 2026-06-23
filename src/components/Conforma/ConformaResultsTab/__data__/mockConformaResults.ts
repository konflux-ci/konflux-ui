import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import type {
  ApplicationConformaResults,
  ConformaResultRow,
} from '../useApplicationConformaResults';

export function generateMockResults(): ApplicationConformaResults {
  const V = CONFORMA_RESULT_STATUS.violations;
  const W = CONFORMA_RESULT_STATUS.warnings;
  const S = CONFORMA_RESULT_STATUS.successes;

  const components = [
    'api-gateway',
    'auth-service',
    'user-service',
    'payment-processor',
    'notification-engine',
    'search-indexer',
    'analytics-collector',
    'cache-manager',
    'event-bus',
    'rate-limiter',
    'session-store',
    'sms-gateway',
    'queue-consumer',
    'audit-logger',
    'config-service',
    'file-uploader',
    'email-sender',
    'report-generator',
    'identity-provider',
    'metrics-exporter',
    'job-scheduler',
    'webhook-relay',
    'data-pipeline',
    'feature-flags',
    'cdn-proxy',
  ];

  const img = (name: string) =>
    `quay.io/myorg/${name}@sha256:${Array.from(name).reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(16).replace('-', '')}00112233445566778899aabb`;

  const rows: ConformaResultRow[] = [];

  const violationRules: {
    title: string;
    description: string;
    solution: string;
    targets: string[];
  }[] = [
    {
      title: 'Missing CVE scan results',
      description:
        'The clair-scan task results have not been found in the SLSA Provenance attestation of the build pipeline.',
      solution: 'Ensure the clair-scan task is included in your build pipeline.',
      targets: [
        'api-gateway',
        'search-indexer',
        'notification-engine',
        'event-bus',
        'data-pipeline',
      ],
    },
    {
      title: 'Missing SLSA provenance',
      description:
        'No SLSA provenance attestation was found for the image. Provenance is required for supply chain security.',
      solution: 'Enable Tekton Chains provenance generation in your pipeline.',
      targets: [
        'api-gateway',
        'search-indexer',
        'notification-engine',
        'event-bus',
        'data-pipeline',
      ],
    },
    {
      title: 'Image signature verification failed',
      description:
        'The container image signature could not be verified against the configured public key.',
      solution: 'Re-sign the image with the correct signing key, or update the policy public key.',
      targets: [
        'api-gateway',
        'search-indexer',
        'notification-engine',
        'event-bus',
        'data-pipeline',
      ],
    },
  ];

  for (const rule of violationRules) {
    for (const comp of rule.targets) {
      rows.push({
        title: rule.title,
        description: rule.description,
        status: V,
        component: comp,
        msg: `${rule.title.replace('Missing ', '').replace(' failed', ' failure')} not found`,
        solution: rule.solution,
        collection: ['minimal'],
        image: img(comp),
      });
    }
  }

  const warningTargets = [
    'api-gateway',
    'analytics-collector',
    'cache-manager',
    'rate-limiter',
    'session-store',
    'sms-gateway',
    'queue-consumer',
    'audit-logger',
  ];
  for (const comp of warningTargets) {
    rows.push({
      title: 'Deprecated API usage detected',
      description:
        'The image was built using a deprecated Tekton API version that will be removed in a future release.',
      status: W,
      component: comp,
      msg: 'Image uses tekton.dev/v1beta1 which is deprecated',
      collection: ['recommended'],
      image: img(comp),
    });
  }

  for (const comp of components) {
    const successes = [
      {
        title: 'No tasks missing',
        description: 'At least one Task is present in the PipelineRun attestation.',
      },
      {
        title: 'Base image is allowed',
        description: 'The base image used in the build is from an approved registry.',
      },
    ];

    const isFailedComp = violationRules.some((r) => r.targets.includes(comp));
    const isWarningComp = warningTargets.includes(comp);

    if (!isFailedComp) {
      successes.push({
        title: 'CVE scan passed',
        description: 'No critical or high CVEs were found in the image.',
      });
    }

    if (!isWarningComp) {
      successes.push({
        title: 'API version current',
        description: 'The image uses the current Tekton API version.',
      });
    }

    for (const s of successes) {
      rows.push({
        title: s.title,
        description: s.description,
        status: S,
        component: comp,
        collection: ['minimal'],
        image: img(comp),
      });
    }
  }

  const totalViolations = rows.filter((r) => r.status === V).length;
  const totalWarnings = rows.filter((r) => r.status === W).length;
  const totalSuccesses = rows.filter((r) => r.status === S).length;

  const failedNames = new Set(violationRules.flatMap((r) => r.targets));

  return {
    componentStatuses: components.map((name) => {
      const compRows = rows.filter((r) => r.component === name);
      const vc = compRows.filter((r) => r.status === V).length;
      const wc = compRows.filter((r) => r.status === W).length;
      const sc = compRows.filter((r) => r.status === S).length;
      return {
        componentName: name,
        status: vc > 0 ? ('fail' as const) : wc > 0 ? ('warning' as const) : ('pass' as const),
        violationCount: vc,
        warningCount: wc,
        successCount: sc,
      };
    }),
    allResults: rows,
    totalComponents: components.length,
    totalFailed: failedNames.size,
    totalViolations,
    totalWarnings,
    totalSuccesses,
    loaded: true,
    error: undefined,
  };
}
