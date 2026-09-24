import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { ReleasesList, ReleasesListProps } from '~/components/Release/ReleasesList';
import { ReleaseKind } from '~/types';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { setupVirtualizerMock } from '~/unit-test-utils/mock-virtualizer';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
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

const defaultProps: ReleasesListProps = {
  releases: mockReleases,
  isLoading: false,
  clusterError: undefined,
  archiveError: undefined,
  hasNextPage: false,
  isFetchingNextPage: false,
  fetchNextPage: jest.fn(),
};

const TestedComponent = ({
  searchParams,
  ...props
}: Partial<ReleasesListProps> & { searchParams?: string }) => (
  <NuqsTestingAdapter searchParams={searchParams}>
    <ReleasesList {...defaultProps} {...props} />
  </NuqsTestingAdapter>
);

describe('ReleasesList', () => {
  beforeEach(() => {
    setupVirtualizerMock();
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show a loading skeleton while releases are loading', () => {
    renderWithQueryClient(<TestedComponent releases={[]} isLoading />);

    expect(screen.getByTestId('table-container')).toBeInTheDocument();
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('table-v2')).not.toBeInTheDocument();
  });

  it('should show an error state when the cluster request fails', () => {
    renderWithQueryClient(
      <TestedComponent releases={[]} clusterError={{ code: 500, message: 'Server error' }} />,
    );

    expect(screen.getByText('Unable to load releases')).toBeInTheDocument();
  });

  it('should show an error state when the archive request fails', () => {
    renderWithQueryClient(<TestedComponent releases={[]} archiveError={{ code: 403 }} />);

    expect(screen.getByText('Unable to load releases')).toBeInTheDocument();
  });

  it('should show the empty state when there are no releases', () => {
    renderWithQueryClient(<TestedComponent releases={[]} />);

    expect(screen.getByText('Learn more about setting up release plans')).toBeInTheDocument();
    expect(screen.queryByTestId('table-v2')).not.toBeInTheDocument();
  });

  it('should render release rows with name, release plan, and snapshot', async () => {
    renderWithQueryClient(<TestedComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('table-v2')).toBeInTheDocument();
    });

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
