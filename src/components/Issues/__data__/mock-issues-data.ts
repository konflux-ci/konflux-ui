import { Issue } from '~/types/issues';

export const mockIssues: Issue[] = [
  {
    id: 'issue-1',
    title: 'Release failed',
    description: 'Readiness probe failed: dial tcp connect: connection refused',
    severity: 'critical',
    issueType: 'release',
    state: 'ACTIVE',
    namespace: 'test-ns',
    detectedAt: '2024-01-01T12:00:00Z',
    scope: {
      resourceType: 'Deployment',
      resourceName: 'my-app',
      resourceNamespace: 'test-ns',
    },
    links: [],
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
  },
  {
    id: 'issue-2',
    title: 'Pipeline run failed',
    description: 'Error executing step: exit status 1',
    severity: 'major',
    issueType: 'pipeline',
    state: 'ACTIVE',
    namespace: 'test-ns',
    detectedAt: '2024-01-01T11:30:00Z',
    scope: {
      resourceType: 'PipelineRun',
      resourceName: 'build-pipeline',
      resourceNamespace: 'test-ns',
    },
    links: [],
    createdAt: '2024-01-01T11:30:00Z',
    updatedAt: '2024-01-01T11:30:00Z',
  },
  {
    id: 'issue-3',
    title: 'Integration test failed',
    description: 'Test timeout after 30 minutes',
    severity: 'minor',
    issueType: 'test',
    state: 'ACTIVE',
    namespace: 'custom-namespace',
    detectedAt: '2024-01-01T11:00:00Z',
    scope: {
      resourceType: 'TaskRun',
      resourceName: 'integration-test',
      resourceNamespace: 'custom-namespace',
    },
    links: [],
    createdAt: '2024-01-01T11:00:00Z',
    updatedAt: '2024-01-01T11:00:00Z',
  },
  {
    id: 'issue-4',
    title: 'Network timeout',
    description: 'Successfully assigned default/pod-abc to node worker-1',
    severity: 'info',
    issueType: 'build',
    state: 'RESOLVED',
    namespace: 'test-ns',
    detectedAt: '2024-01-01T10:30:00Z',
    scope: {
      resourceType: 'Pod',
      resourceName: 'pod-abc',
      resourceNamespace: 'test-ns',
    },
    links: [],
    createdAt: '2024-01-01T10:30:00Z',
    updatedAt: '2024-01-01T11:00:00Z',
  },
  {
    id: 'issue-5',
    title: 'Dependency issue',
    description: 'Package dependency conflict detected',
    severity: 'minor',
    issueType: 'dependency',
    state: 'ACTIVE',
    namespace: 'test-ns',
    detectedAt: '2024-01-01T10:00:00Z',
    scope: {
      resourceType: 'Component',
      resourceName: 'frontend-component',
      resourceNamespace: 'test-ns',
    },
    links: [],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  },
  {
    id: 'issue-6',
    title: 'Build timeout',
    description: 'Build process exceeded maximum time limit',
    severity: 'major',
    issueType: 'build',
    state: 'ACTIVE',
    namespace: 'test-ns',
    detectedAt: '2024-01-01T09:30:00Z',
    scope: {
      resourceType: 'Component',
      resourceName: 'backend-component',
      resourceNamespace: 'test-ns',
    },
    links: [],
    createdAt: '2024-01-01T09:30:00Z',
    updatedAt: '2024-01-01T09:30:00Z',
  },
];

export const mockActiveIssues = mockIssues.filter((issue) => issue.state === 'ACTIVE');

export const mockResolvedIssues = mockIssues.filter((issue) => issue.state === 'RESOLVED');

export const mockCriticalIssues = mockIssues.filter((issue) => issue.severity === 'critical');

export const mockTestNamespaceIssues = mockIssues.filter((issue) => issue.namespace === 'test-ns');

// Mock data with all severity types for testing
export const mockAllSeverityIssues = [
  { ...mockIssues[0], severity: 'critical' as const },
  { ...mockIssues[1], severity: 'major' as const },
  { ...mockIssues[4], severity: 'minor' as const },
  { ...mockIssues[3], severity: 'info' as const },
];
