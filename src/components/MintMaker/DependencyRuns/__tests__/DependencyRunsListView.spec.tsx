import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { MINTMAKER_NAMESPACE } from '~/consts/constants';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useComponent, useComponents } from '~/hooks/useComponents';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import { PipelineRunKind, PipelineRunStatus } from '~/types';
import { createUseApplicationMock } from '~/unit-test-utils/mock-application-hooks';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { setupVirtualizerMock } from '~/unit-test-utils/mock-virtualizer';
import { DependencyRunsListView } from '../DependencyRunsListView';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: jest.fn(),
  useLocation: jest.fn(() => ({ pathname: '/ns/test-ns' })),
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponent: jest.fn(),
  useComponents: jest.fn(),
}));

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

const useComponentMock = useComponent as jest.Mock;
const useComponentsMock = useComponents as jest.Mock;
const usePipelineRunsV2Mock = usePipelineRunsV2 as jest.Mock;

mockUseNamespaceHook('test-ns');

const mockComponentData = {
  metadata: {
    name: 'test-component',
    creationTimestamp: '2023-01-01T00:00:00Z',
  },
};

const mockApplicationData = {
  metadata: {
    name: 'test-application',
    creationTimestamp: '2022-01-01T00:00:00Z',
  },
};

const useApplicationMock = createUseApplicationMock([mockApplicationData, true, undefined]);

const mockApplicationComponents = [
  {
    metadata: { name: 'component-alpha' },
    spec: { application: 'test-application' },
  },
];

const makePipelineRun = (
  name: string,
  overrides: Partial<PipelineRunKind> = {},
): PipelineRunKind => ({
  kind: 'PipelineRun',
  apiVersion: 'tekton.dev/v1beta1',
  metadata: {
    name,
    namespace: 'test-ns',
    creationTimestamp: '2023-01-01T00:00:00Z',
    uid: `uid-${name}`,
    labels: {
      [PipelineRunLabel.MINTMAKER_COMPONENT_LABEL]: 'component-alpha',
    },
  },
  spec: {},
  status: {
    conditions: [{ status: 'True', type: 'Succeeded' }],
    startTime: '2023-01-01T00:00:00Z',
    completionTime: '2023-01-01T00:05:00Z',
  } as PipelineRunStatus,
  ...overrides,
});

const mockRuns: PipelineRunKind[] = [
  makePipelineRun('dependency-run-alpha'),
  makePipelineRun('dependency-run-beta'),
];

const noNextPage = { isFetchingNextPage: false, hasNextPage: false };

const TestedComponent = ({ searchParams }: { searchParams?: string }) => (
  <NuqsTestingAdapter searchParams={searchParams}>
    <DependencyRunsListView applicationName="test-application" componentName="test-component" />
  </NuqsTestingAdapter>
);

const TestedApplication = ({ searchParams }: { searchParams?: string }) => (
  <NuqsTestingAdapter searchParams={searchParams}>
    <DependencyRunsListView applicationName="test-application" />
  </NuqsTestingAdapter>
);

describe('DependencyRunsListView', () => {
  const setupSharedMocks = () => {
    setupVirtualizerMock();
    useApplicationMock.mockReturnValue([mockApplicationData, true, undefined]);
    usePipelineRunsV2Mock.mockReturnValue([mockRuns, true, null, jest.fn(), noNextPage]);
  };

  const setupComponentScopedMocks = () => {
    setupSharedMocks();
    useComponentMock.mockReturnValue([mockComponentData, true, undefined]);
    useComponentsMock.mockReturnValue([[], true, undefined]);
  };

  const setupApplicationScopedMocks = () => {
    setupSharedMocks();
    useComponentMock.mockReturnValue([undefined, true, undefined]);
    useComponentsMock.mockReturnValue([[], true, undefined]);
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('component-scoped runs', () => {
    beforeEach(setupComponentScopedMocks);

    it('renders skeleton while data is not loaded', () => {
      usePipelineRunsV2Mock.mockReturnValue([[], false, null, jest.fn(), noNextPage]);
      renderWithQueryClient(<TestedComponent />);
      expect(screen.getByTestId('table-container')).toBeInTheDocument();
      expect(screen.queryByTestId('table-v2')).not.toBeInTheDocument();
    });

    it('renders empty state when no runs exist and no filters are active', () => {
      usePipelineRunsV2Mock.mockReturnValue([[], true, null, jest.fn(), noNextPage]);
      renderWithQueryClient(<TestedComponent />);
      expect(screen.getByText('No dependency update runs yet')).toBeVisible();
    });

    it('renders pipeline run rows when data is available', async () => {
      renderWithQueryClient(<TestedComponent />);
      await waitFor(() => {
        expect(screen.getByText('dependency-run-alpha')).toBeInTheDocument();
        expect(screen.getByText('dependency-run-beta')).toBeInTheDocument();
      });
    });

    it('renders error state when pipeline runs error occurs', () => {
      usePipelineRunsV2Mock.mockReturnValue([
        [],
        true,
        new Error('500: Internal server error'),
        jest.fn(),
        noNextPage,
      ]);
      renderWithQueryClient(<TestedComponent />);
      expect(screen.getByText('Unable to load dependency runs')).toBeInTheDocument();
    });

    it('renders error state when component error occurs', () => {
      useComponentMock.mockReturnValue([undefined, true, new Error('404: Not found')]);
      usePipelineRunsV2Mock.mockReturnValue([[], false, null, jest.fn(), noNextPage]);
      renderWithQueryClient(<TestedComponent />);
      expect(screen.getByText('Unable to load dependency runs')).toBeInTheDocument();
    });

    it('renders a spinner while the component is loading', () => {
      useComponentMock.mockReturnValue([undefined, false, undefined]);
      renderWithQueryClient(<TestedComponent />);
      expect(screen.getByTestId('dependency-runs-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('table-container')).not.toBeInTheDocument();
      expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(null, expect.anything());
    });

    it('shows the filter toolbar', () => {
      renderWithQueryClient(<TestedComponent />);
      expect(screen.queryByTestId('filter-toolbar')).toBeInTheDocument();
    });

    it('does not show the component filter', () => {
      renderWithQueryClient(<TestedComponent />);
      expect(screen.queryByTestId('multi-select-filter-component')).not.toBeInTheDocument();
    });

    it('does not fetch pipeline runs until the component is loaded', () => {
      useComponentMock.mockReturnValue([undefined, false, undefined]);
      renderWithQueryClient(<TestedComponent />);
      expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(null, expect.anything());
    });

    it('uses the component hook and disables the components hook', () => {
      renderWithQueryClient(<TestedComponent />);
      expect(useComponentMock).toHaveBeenCalledWith('test-ns', 'test-component', true);
      expect(useComponentsMock).toHaveBeenCalledWith('test-ns', undefined, true);
    });

    it('does not fetch pipeline runs when component has an error', () => {
      useComponentMock.mockReturnValue([undefined, true, new Error('Not found')]);
      renderWithQueryClient(<TestedComponent />);
      expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(null, expect.anything());
    });

    it('does not require application data to render component-scoped runs', async () => {
      useApplicationMock.mockReturnValue([undefined, false, new Error('Application unavailable')]);
      renderWithQueryClient(<TestedComponent />);
      await waitFor(() => {
        expect(screen.getByText('dependency-run-alpha')).toBeInTheDocument();
      });
    });

    it('shows loading skeleton rows while fetching the next page', async () => {
      usePipelineRunsV2Mock.mockReturnValue([
        mockRuns,
        true,
        null,
        jest.fn(),
        { isFetchingNextPage: true, hasNextPage: true },
      ]);
      renderWithQueryClient(<TestedComponent />);
      await waitFor(() => {
        expect(screen.getAllByTestId('table-loading-more').length).toBeGreaterThan(0);
      });
    });

    it('shows filtered empty state when active filters yield no results', () => {
      renderWithQueryClient(<TestedComponent searchParams="?status=%5B%22no-match-xyz%22%5D" />);
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('fetches pipeline runs from MINTMAKER_NAMESPACE when the component is loaded', () => {
      renderWithQueryClient(<TestedComponent />);
      expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(MINTMAKER_NAMESPACE, expect.anything());
    });

    it('passes component and namespace labels as matchLabels to usePipelineRunsV2', () => {
      renderWithQueryClient(<TestedComponent />);
      expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          selector: expect.objectContaining({
            filterByCreationTimestampAfter: '2023-01-01T00:00:00Z',
            matchLabels: expect.objectContaining({
              [PipelineRunLabel.MINTMAKER_COMPONENT_LABEL]: 'test-component',
              [PipelineRunLabel.MINTMAKER_NAMESPACE_LABEL]: 'test-ns',
            }),
          }),
        }),
      );
    });

    it('does not add a component API expression to component-scoped runs', () => {
      renderWithQueryClient(<TestedComponent />);

      expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(
        MINTMAKER_NAMESPACE,
        expect.objectContaining({
          selector: expect.objectContaining({
            matchExpressions: [],
          }),
        }),
      );
    });
  });

  describe('application-scoped runs', () => {
    beforeEach(setupApplicationScopedMocks);

    it('renders a spinner while application components are loading', () => {
      useComponentsMock.mockReturnValue([[], false, undefined]);
      renderWithQueryClient(<TestedApplication />);
      expect(screen.getByTestId('dependency-runs-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('table-container')).not.toBeInTheDocument();
    });

    it('renders a spinner while the application is loading', () => {
      useApplicationMock.mockReturnValue([undefined, false, undefined]);
      renderWithQueryClient(<TestedApplication />);
      expect(screen.getByTestId('dependency-runs-spinner')).toBeInTheDocument();
      expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(null, expect.anything());
    });

    it('renders error state when application components fail to load', () => {
      useComponentsMock.mockReturnValue([[], true, new Error('500: Components unavailable')]);
      renderWithQueryClient(<TestedApplication />);
      expect(screen.getByText('Unable to load dependency runs')).toBeInTheDocument();
    });

    it('renders error state when the application fails to load', () => {
      useApplicationMock.mockReturnValue([
        undefined,
        true,
        new Error('500: Application unavailable'),
      ]);
      renderWithQueryClient(<TestedApplication />);
      expect(screen.getByText('Unable to load dependency runs')).toBeInTheDocument();
    });

    it('shows the component filter', () => {
      useComponentsMock.mockReturnValue([mockApplicationComponents, true, undefined]);
      renderWithQueryClient(<TestedApplication />);
      expect(screen.getByTestId('multi-select-filter-component')).toBeInTheDocument();
    });

    it('uses the components hook and disables the component hook', () => {
      renderWithQueryClient(<TestedApplication />);
      expect(useComponentMock).toHaveBeenCalledWith('test-ns', undefined, true);
      expect(useComponentsMock).toHaveBeenCalledWith('test-ns', 'test-application', true);
    });

    it('passes the API name filter and application labels to usePipelineRunsV2', () => {
      renderWithQueryClient(<TestedApplication searchParams="?name=dependency-run" />);

      expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(
        MINTMAKER_NAMESPACE,
        expect.objectContaining({
          selector: expect.objectContaining({
            filterByName: 'dependency-run',
            matchLabels: {
              [PipelineRunLabel.MINTMAKER_APPLICATION_LABEL]: 'test-application',
              [PipelineRunLabel.MINTMAKER_NAMESPACE_LABEL]: 'test-ns',
            },
          }),
        }),
      );
    });

    it('uses the application creation timestamp for application-scoped runs', () => {
      renderWithQueryClient(<TestedApplication />);

      expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(
        MINTMAKER_NAMESPACE,
        expect.objectContaining({
          selector: expect.objectContaining({
            filterByCreationTimestampAfter: '2022-01-01T00:00:00Z',
          }),
        }),
      );
    });

    it('does not fetch pipeline runs until the application is loaded', () => {
      useApplicationMock.mockReturnValue([undefined, false, undefined]);
      renderWithQueryClient(<TestedApplication />);

      expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(null, expect.anything());
    });

    it('passes selected components as an API match expression', () => {
      useComponentsMock.mockReturnValue([mockApplicationComponents, true, undefined]);
      renderWithQueryClient(
        <TestedApplication searchParams="?component=%5B%22component-alpha%22%5D" />,
      );

      expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(
        MINTMAKER_NAMESPACE,
        expect.objectContaining({
          selector: expect.objectContaining({
            matchExpressions: [
              {
                key: PipelineRunLabel.MINTMAKER_COMPONENT_LABEL,
                operator: 'In',
                values: ['component-alpha'],
              },
            ],
          }),
        }),
      );
    });
  });
});
