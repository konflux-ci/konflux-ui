import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { ComponentGroupReleasesTab } from '~/components/ComponentGroups/ComponentGroupDetails/tabs/ComponentGroupReleasesTab/ComponentGroupReleasesTab';
import { ReleaseLabel } from '~/consts/release';
import { useReleases } from '~/hooks/useReleases';
import { ReleaseKind } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { setupVirtualizerMock } from '~/unit-test-utils/mock-virtualizer';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ groupName: 'my-group' }),
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    'data-test'?: string;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('~/hooks/useReleases', () => ({
  useReleases: jest.fn(),
}));

jest.mock('~/feature-flags/hooks', () => ({
  ...jest.requireActual('~/feature-flags/hooks'),
  IfFeature: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const useReleasesMock = useReleases as jest.Mock;

mockUseNamespaceHook('test-ns');

const mockReleases: ReleaseKind[] = [
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Release',
    metadata: {
      name: 'release-one',
      namespace: 'test-ns',
      uid: 'uid-1',
      creationTimestamp: '2024-01-01T00:00:00Z',
      labels: {
        'appstudio.openshift.io/component': 'component-a',
      },
    },
    spec: {
      releasePlan: 'plan-a',
      snapshot: 'snapshot-a',
    },
    status: {
      startTime: '2024-01-01T00:00:00Z',
      completionTime: '2024-01-01T00:10:00Z',
    },
  },
  {
    apiVersion: 'appstudio.redhat.com/v1alpha1',
    kind: 'Release',
    metadata: {
      name: 'release-two',
      namespace: 'test-ns',
      uid: 'uid-2',
      creationTimestamp: '2024-02-01T00:00:00Z',
      labels: {
        'appstudio.openshift.io/component': 'component-b',
      },
    },
    spec: {
      releasePlan: 'plan-b',
      snapshot: 'snapshot-b',
    },
    status: {
      startTime: '2024-02-01T00:00:00Z',
      completionTime: '2024-02-01T00:05:00Z',
    },
  },
];

const mockBaseResult = {
  data: mockReleases,
  getSource: jest.fn(),
  clusterLoading: false,
  archiveLoading: false,
  isLoading: false,
  clusterError: undefined,
  archiveError: undefined,
  hasError: false,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(),
  clusterData: mockReleases,
  archiveData: undefined,
};

const TestedComponent = ({ searchParams }: { searchParams?: string }) => (
  <NuqsTestingAdapter searchParams={searchParams}>
    <ComponentGroupReleasesTab />
  </NuqsTestingAdapter>
);

describe('ComponentGroupReleasesTab', () => {
  beforeEach(() => {
    setupVirtualizerMock();
    useReleasesMock.mockReturnValue(mockBaseResult);
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call useReleases with the current namespace and group match labels', () => {
    renderWithQueryClient(<TestedComponent />);

    expect(useReleasesMock).toHaveBeenCalledWith('test-ns', {
      [ReleaseLabel.COMPONENT_GROUP]: 'my-group',
    });
  });

  it('should show a loading skeleton while releases are loading', () => {
    useReleasesMock.mockReturnValue({ ...mockBaseResult, data: [], isLoading: true });

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByTestId('table-container')).toBeInTheDocument();
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('table-v2')).not.toBeInTheDocument();
  });

  it('should show an error state when the cluster request fails', () => {
    useReleasesMock.mockReturnValue({
      ...mockBaseResult,
      data: [],
      clusterError: { code: 500, message: 'Server error' },
    });

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByText('Unable to load releases')).toBeInTheDocument();
  });

  it('should show an error state when the archive request fails', () => {
    useReleasesMock.mockReturnValue({
      ...mockBaseResult,
      data: [],
      archiveError: { code: 403 },
    });

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByText('Unable to load releases')).toBeInTheDocument();
  });

  it('should show the empty state when there are no releases', () => {
    useReleasesMock.mockReturnValue({ ...mockBaseResult, data: [] });

    renderWithQueryClient(<TestedComponent />);

    expect(screen.getByText('Learn more about setting up release plans')).toBeInTheDocument();
    expect(screen.queryByTestId('table-v2')).not.toBeInTheDocument();
  });

  it('should render release rows with name, release plan, and snapshot', async () => {
    renderWithQueryClient(<TestedComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('table-v2')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 3, name: /Releases/i })).toBeInTheDocument();
    expect(screen.getByTestId('filter-toolbar')).toBeInTheDocument();

    expect(screen.getByText('release-one')).toBeInTheDocument();
    expect(screen.getByText('release-two')).toBeInTheDocument();
    expect(screen.getByText('plan-a')).toBeInTheDocument();
    expect(screen.getByText('snapshot-b')).toBeInTheDocument();
  });

  it('should show the filtered empty state when the name filter matches nothing', () => {
    renderWithQueryClient(<TestedComponent searchParams="?name=does-not-exist" />);

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.queryByTestId('table-v2')).not.toBeInTheDocument();
  });

  it('should filter releases by name from the URL', async () => {
    renderWithQueryClient(<TestedComponent searchParams="?name=release-one" />);

    await waitFor(() => {
      expect(screen.getByText('release-one')).toBeInTheDocument();
    });

    expect(screen.queryByText('release-two')).not.toBeInTheDocument();
  });
});
