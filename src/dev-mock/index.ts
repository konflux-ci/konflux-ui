import { Issue, IssueResponse, IssueSeverity, IssueState, IssueType } from '~/kite/issue-type';
import { NamespaceKind } from '~/types';
import {
  buildMockWorkspaceConformaViolations,
  MOCK_WORKSPACE_CONFORMA_VIOLATIONS,
} from './mockWorkspaceConformaViolations';

export { buildMockWorkspaceConformaViolations, MOCK_WORKSPACE_CONFORMA_VIOLATIONS };

/**
 * Development-only mock mode.
 *
 * Activated by appending ?mock=dev to the URL.
 * Guards are all wrapped in NODE_ENV checks so none of this code ships
 * in production bundles.
 *
 * Usage:
 * - Issues dashboard: https://localhost:8080/ns/mock-workspace/issues?mock=dev
 * - Conforma Results tab: append ?mock=conforma (or use ?mock=dev on the same page)
 *   e.g. .../applications/my-app/conforma-results?mock=conforma
 * Then enable "issues-dashboard" and "conforma-policy" in the feature flag panel.
 */
export const isDeveloperMockMode = (): boolean =>
  process.env.NODE_ENV === 'development' &&
  new URLSearchParams(window.location.search).get('mock') === 'dev';

/** Rich Conforma Results tab data (?mock=conforma, or ?mock=dev for local screenshots). */
export const isConformaMockMode = (): boolean =>
  process.env.NODE_ENV === 'development' &&
  (new URLSearchParams(window.location.search).has('mock', 'conforma') ||
    isDeveloperMockMode());

// ---------------------------------------------------------------------------
// Mock namespace data
// ---------------------------------------------------------------------------

const mockNamespace = (name: string): NamespaceKind =>
  ({
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: { name, uid: `mock-uid-${name}`, resourceVersion: '1' },
    status: { phase: 'Active' },
  }) as unknown as NamespaceKind;

export const MOCK_WORKSPACE_NAME = 'mock-workspace';

export const MOCK_NAMESPACES: NamespaceKind[] = [
  mockNamespace(MOCK_WORKSPACE_NAME),
  mockNamespace('mock-workspace-2'),
];

// ---------------------------------------------------------------------------
// Mock Kite issues data
// ---------------------------------------------------------------------------

const mockIssue = (overrides: Partial<Issue>): Issue => ({
  id: `mock-issue-${Math.random().toString(36).slice(2)}`,
  title: 'Mock issue',
  description: 'This is mock data for local development',
  severity: IssueSeverity.MAJOR,
  issueType: IssueType.BUILD,
  state: IssueState.ACTIVE,
  detectedAt: new Date(Date.now() - 3_600_000).toISOString(),
  namespace: MOCK_WORKSPACE_NAME,
  scope: {
    resourceType: 'component',
    resourceName: 'mock-component',
    resourceNamespace: MOCK_WORKSPACE_NAME,
  },
  links: [],
  relatedFrom: [],
  relatedTo: [],
  createdAt: new Date(Date.now() - 7_200_000).toISOString(),
  updatedAt: new Date(Date.now() - 3_600_000).toISOString(),
  ...overrides,
});

export const MOCK_ISSUES: Issue[] = [
  mockIssue({ id: 'mock-1', title: 'Pipeline failed: build-push-comp-a', severity: IssueSeverity.CRITICAL, issueType: IssueType.BUILD }),
  mockIssue({ id: 'mock-2', title: 'Test failure: integration-test-comp-b', severity: IssueSeverity.MAJOR, issueType: IssueType.TEST }),
  mockIssue({ id: 'mock-3', title: 'Release pipeline error: release-comp-c', severity: IssueSeverity.MAJOR, issueType: IssueType.RELEASE }),
  mockIssue({ id: 'mock-4', title: 'MintMaker: outdated dependency detected', severity: IssueSeverity.MINOR, issueType: IssueType.DEPENDENCY }),
  mockIssue({ id: 'mock-5', title: 'Pipeline stalled: build-push-comp-d', severity: IssueSeverity.MINOR, issueType: IssueType.PIPELINE }),
  mockIssue({ id: 'mock-6', title: 'Build failure: comp-e image push', severity: IssueSeverity.CRITICAL, issueType: IssueType.BUILD }),
  mockIssue({ id: 'mock-7', title: 'Integration test timeout: comp-f', severity: IssueSeverity.INFO, issueType: IssueType.TEST, state: IssueState.RESOLVED, updatedAt: new Date(Date.now() - 1_800_000).toISOString() }),
];

export const mockIssueResponse = (issues: Issue[]): IssueResponse => ({
  data: issues,
  total: issues.length,
  limit: issues.length,
  offset: 0,
});

