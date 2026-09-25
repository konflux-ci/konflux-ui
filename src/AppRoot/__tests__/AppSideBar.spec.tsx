import React from 'react';
import { screen } from '@testing-library/react';
import { Issue, IssueSeverity, IssueState, IssueType } from '~/kite/issue-type';
import { useCriticalAndMajorIssues } from '~/kite/kite-hooks';
import { useActiveRouteChecker } from '../../../src/hooks/useActiveRouteChecker';
import { useNamespace } from '../../shared/providers/Namespace';
import { routerRenderer } from '../../utils/test-utils';
import { AppSideBar } from '../AppSideBar';

jest.mock('../../../src/hooks/useActiveRouteChecker', () => ({
  useActiveRouteChecker: jest.fn(),
}));

jest.mock('../../shared/providers/Namespace', () => ({
  useNamespace: jest.fn(),
}));

const mockFeatureFlags: Record<string, boolean> = {
  'component-model': true,
  'pipeline-runs-page': true,
  mintmaker: true,
};

jest.mock('~/shared/components/SavedViews', () => ({
  SavedViewNavSection: ({ title, 'data-test': dataTest, ...rest }: Record<string, unknown>) => (
    <li data-test={dataTest} className={rest.disabled ? 'app-side-bar__nav-item--disabled' : ''}>
      {typeof title === 'string' ? title : 'Pipeline Runs'}
    </li>
  ),
  SavedViewNavItems: () => <li data-test="saved-view-nav-items">Saved views</li>,
}));

jest.mock('~/feature-flags/hooks', () => ({
  ...jest.requireActual('~/feature-flags/hooks'),
  useIsOnFeatureFlag: (flag: string) => mockFeatureFlags[flag] ?? false,
  IfFeature: ({
    flag,
    children,
    fallback,
  }: {
    flag: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }) => <>{mockFeatureFlags[flag] ? children : fallback ?? null}</>,
}));

jest.mock('~/feature-flags/FeatureFlagIndicator', () => ({
  FeatureFlagIndicator: () => null,
}));

jest.mock('~/kite/kite-hooks', () => ({
  useIssues: jest.fn(() => ({
    data: { data: [], total: 0, limit: 20, offset: 0 },
    isLoading: false,
    error: null,
  })),
  useInfiniteIssues: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    error: null,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  })),
  useCriticalAndMajorIssues: jest.fn(),
}));

const mockUseCriticalAndMajorIssues = useCriticalAndMajorIssues as jest.Mock;

const createMockIssue = (severity: IssueSeverity, state: IssueState, id: string): Issue => ({
  id,
  title: `Test Issue ${id}`,
  description: 'Test description',
  severity,
  issueType: IssueType.BUILD,
  state,
  detectedAt: '2023-10-01T12:00:00Z',
  namespace: 'test-namespace',
  scope: {
    resourceType: 'test-resource',
    resourceName: 'test-name',
    resourceNamespace: 'test-namespace',
  },
  links: [],
  relatedFrom: [],
  relatedTo: [],
  createdAt: '2023-10-01T12:00:00Z',
  updatedAt: '2023-10-01T12:00:00Z',
});

describe('AppSideBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFeatureFlags['component-model'] = true;
    mockFeatureFlags['pipeline-runs-page'] = true;
    mockFeatureFlags.mintmaker = true;
    // Default mock - no issues
    mockUseCriticalAndMajorIssues.mockReturnValue({
      data: [
        {
          severity: IssueSeverity.CRITICAL,
          issues: [],
          total: 0,
          isLoading: false,
          error: null,
        },
        {
          severity: IssueSeverity.MAJOR,
          issues: [],
          total: 0,
          isLoading: false,
          error: null,
        },
      ],
      isLoaded: true,
      hasError: false,
    });
  });

  it('should render the sidebar', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue('test-namespace');

    routerRenderer(<AppSideBar isOpen={true} />);
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('should highlight the active route', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue((path) => path === '/');
    (useNamespace as jest.Mock).mockReturnValue('test-namespace');

    routerRenderer(<AppSideBar isOpen={true} />);
    expect(screen.getByText('Overview')).toHaveClass('active');
  });

  it('should disable namespace-dependent links when no namespace is selected', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue(null);

    routerRenderer(<AppSideBar isOpen={true} />);

    expect(screen.getByText('Namespaces').closest('li')).not.toHaveClass(
      'app-side-bar__nav-item--disabled',
    );

    expect(screen.getByText('Applications').closest('li')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
    expect(screen.getByText('Components').closest('li')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
    expect(screen.getByText('Groups').closest('li')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
    expect(screen.getByText('Issues').closest('li')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
    expect(screen.getByTestId('pipeline-runs-nav-group')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
    expect(screen.getByText('Secrets').closest('li')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
    expect(screen.getByText('Releases').closest('li')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
    expect(screen.getByText('User Access').closest('li')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
  });

  it('should generate correct links when namespace is selected', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue('test-namespace');

    routerRenderer(<AppSideBar isOpen={true} />);

    expect(screen.getByText('Applications')).toHaveAttribute(
      'href',
      '/ns/test-namespace/applications',
    );
    expect(screen.getByText('Components')).toHaveAttribute('href', '/ns/test-namespace/components');
    expect(screen.getByText('Groups')).toHaveAttribute('href', '/ns/test-namespace/groups');
    expect(screen.getByText('Issues')).toHaveAttribute('href', '/ns/test-namespace/issues');
    expect(screen.getByText('Secrets')).toHaveAttribute('href', '/ns/test-namespace/secrets');
    expect(screen.getByText('Releases')).toHaveAttribute('href', '/ns/test-namespace/release');
    expect(screen.getByText('User Access')).toHaveAttribute('href', '/ns/test-namespace/access');
    expect(screen.getByTestId('saved-view-nav-items')).toBeInTheDocument();
  });

  it('should render the Pipeline Runs nav expandable group', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue('test-namespace');

    routerRenderer(<AppSideBar isOpen={true} />);
    expect(screen.getByTestId('pipeline-runs-nav-group')).toBeInTheDocument();
    expect(screen.getByText('Pipeline Runs')).toBeInTheDocument();
  });

  it('should disable Pipeline Runs group when no namespace is selected', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue(null);

    routerRenderer(<AppSideBar isOpen={true} />);
    expect(screen.getByTestId('pipeline-runs-nav-group')).toHaveClass(
      'app-side-bar__nav-item--disabled',
    );
  });

  it('should hide saved-view navigation when Pipeline Runs is disabled', () => {
    mockFeatureFlags['pipeline-runs-page'] = false;
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue('test-namespace');

    routerRenderer(<AppSideBar isOpen={true} />);

    expect(screen.queryByTestId('pipeline-runs-nav-group')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saved-view-nav-items')).not.toBeInTheDocument();
  });

  it('should not render links for disabled namespace-dependent routes when no namespace is available', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue(null);

    routerRenderer(<AppSideBar isOpen={true} />);

    expect(screen.getByText('Namespaces')).toHaveAttribute('href', '/ns');
    expect(screen.getByText('Applications')).toHaveAttribute('href', '/');
    expect(screen.getByText('Components')).toHaveAttribute('href', '/');
    expect(screen.getByText('Groups')).toHaveAttribute('href', '/');
    expect(screen.getByText('Issues')).toHaveAttribute('href', '/');
    expect(screen.getByText('Secrets')).toHaveAttribute('href', '/');
    expect(screen.getByText('Releases')).toHaveAttribute('href', '/');
    expect(screen.getByText('User Access')).toHaveAttribute('href', '/');
    expect(screen.queryByTestId('saved-view-nav-items')).not.toBeInTheDocument();
  });

  it('should render the dependency updates schedule link when MintMaker is enabled', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue('test-namespace');

    routerRenderer(<AppSideBar isOpen={true} />);

    expect(screen.getByRole('link', { name: /Dependency updates schedule/ })).toHaveAttribute(
      'href',
      '/dep-updates-schedule',
    );
  });

  it('should hide the dependency updates schedule link when MintMaker is disabled', () => {
    mockFeatureFlags.mintmaker = false;
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue('test-namespace');

    routerRenderer(<AppSideBar isOpen={true} />);

    expect(
      screen.queryByRole('link', { name: /Dependency updates schedule/ }),
    ).not.toBeInTheDocument();
  });

  it('should render the Groups nav item', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue('test-namespace');

    routerRenderer(<AppSideBar isOpen={true} />);
    expect(screen.getByText('Groups')).toBeInTheDocument();
  });

  it('should render critical issues icon when active critical issues exist', () => {
    (useActiveRouteChecker as jest.Mock).mockReturnValue(() => false);
    (useNamespace as jest.Mock).mockReturnValue('test-namespace');

    mockUseCriticalAndMajorIssues.mockReturnValue({
      data: [
        {
          severity: IssueSeverity.CRITICAL,
          issues: [createMockIssue(IssueSeverity.CRITICAL, IssueState.ACTIVE, 'crit-1')],
          total: 1,
          isLoading: false,
          error: null,
        },
        {
          severity: IssueSeverity.MAJOR,
          issues: [],
          total: 0,
          isLoading: false,
          error: null,
        },
      ],
      isLoaded: true,
      hasError: false,
    });

    routerRenderer(<AppSideBar isOpen={true} />);

    expect(screen.getByTestId('critical-issues-icon')).toBeInTheDocument();
  });
});
