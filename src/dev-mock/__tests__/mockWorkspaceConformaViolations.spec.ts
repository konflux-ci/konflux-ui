import {
  buildMockWorkspaceConformaViolations,
  MOCK_WORKSPACE_CONFORMA_VIOLATIONS,
} from '../mockWorkspaceConformaViolations';

describe('mockWorkspaceConformaViolations', () => {
  it('builds 50 applications with violations sorted by violation count', () => {
    const result = buildMockWorkspaceConformaViolations(50);

    expect(result.applications).toHaveLength(50);
    expect(result.applications.every((a) => a.violationCount > 0)).toBe(true);
    expect(result.totalViolations).toBe(
      result.applications.reduce((s, a) => s + a.violationCount, 0),
    );
    expect(result.totalWarnings).toBe(
      result.applications.reduce((s, a) => s + a.warningCount, 0),
    );

    for (let i = 1; i < result.applications.length; i++) {
      expect(result.applications[i - 1].violationCount).toBeGreaterThanOrEqual(
        result.applications[i].violationCount,
      );
    }
  });

  it('exports default mock with 50 applications', () => {
    expect(MOCK_WORKSPACE_CONFORMA_VIOLATIONS.applications).toHaveLength(50);
    expect(MOCK_WORKSPACE_CONFORMA_VIOLATIONS.loaded).toBe(true);
  });
});
