import { Issue, IssueSeverity, IssueState, IssueType } from '~/kite/issue-type';

export const createMockIssue = (overrides: Partial<Issue> = {}): Issue => ({
  id: 'issue-1',
  title: 'Test Issue',
  description: 'Test description',
  severity: IssueSeverity.CRITICAL,
  issueType: IssueType.BUILD,
  state: IssueState.ACTIVE,
  detectedAt: '2024-01-01T00:00:00Z',
  namespace: 'test-ns',
  scope: {
    resourceType: 'component',
    resourceName: 'test-component',
    resourceNamespace: 'test-ns',
  },
  links: [
    {
      id: 'link-1',
      title: 'Link 1',
      url: 'https://example.com/link1',
      issueId: 'issue-1',
    },
  ],
  relatedFrom: [],
  relatedTo: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});
