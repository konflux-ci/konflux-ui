import type { AppViolationSummary } from '~/components/Issues/useWorkspaceConformaViolations';
import type { WorkspaceConformaViolations } from '~/components/Issues/useWorkspaceConformaViolations';

const MOCK_APP_NAME_PREFIXES = [
  'platform',
  'checkout',
  'inventory',
  'billing',
  'notification',
  'analytics',
  'identity',
  'catalog',
  'shipping',
  'search',
] as const;

/**
 * Builds workspace-level conforma violation summaries for dev mock mode.
 * Default: 50 applications, each with at least one violation, sorted by severity.
 */
export const buildMockWorkspaceConformaViolations = (
  applicationCount = 50,
): WorkspaceConformaViolations => {
  const applications: AppViolationSummary[] = Array.from(
    { length: applicationCount },
    (_, i) => {
      const prefix = MOCK_APP_NAME_PREFIXES[i % MOCK_APP_NAME_PREFIXES.length];
      const suffix = String(i + 1).padStart(2, '0');
      const violationCount = Math.max(1, 14 - Math.floor(i / 4) + (i % 3));
      const warningCount = i % 5 === 0 ? 0 : 1 + (i % 4);

      return {
        applicationName: `${prefix}-service-${suffix}`,
        violationCount,
        warningCount,
      };
    },
  ).sort((a, b) => b.violationCount - a.violationCount);

  const totalViolations = applications.reduce((sum, a) => sum + a.violationCount, 0);
  const totalWarnings = applications.reduce((sum, a) => sum + a.warningCount, 0);

  return {
    applications,
    totalViolations,
    totalWarnings,
    loaded: true,
    error: undefined,
  };
};

/** Default dev mock: violations across 50 applications (Issues dashboard). */
export const MOCK_WORKSPACE_CONFORMA_VIOLATIONS = buildMockWorkspaceConformaViolations(50);
