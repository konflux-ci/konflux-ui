import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { PipelineRunLabel, PipelineRunType } from '~/consts/pipelinerun';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsForCommitV2';
import { PipelineRunKind } from '~/types';
import { mockUseNamespaceHook } from '../../../../../unit-test-utils';
import { CommitPipelineRunsList } from '../CommitPipelineRunsList';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
      <a href={to}>{children}</a>
    ),
  };
});

jest.mock('~/hooks/usePipelineRunsForCommitV2', () => ({
  usePipelineRunsForCommitV2: jest.fn(),
}));

const mockUsePipelineRunsForCommitV2 = usePipelineRunsForCommitV2 as jest.Mock;

const mockNamespace = 'test-namespace';
const mockApplication = 'test-app';
const mockCommit = 'abc123def456';

const commitRoutePath = '/ns/:workspaceName/applications/:applicationName/commit/:commitName';

const renderWithRouter = (
  ui: React.ReactElement,
  {
    applicationName = mockApplication,
    commitName = mockCommit,
    namespace = mockNamespace,
  }: { applicationName?: string; commitName?: string; namespace?: string } = {},
) => {
  mockUseNamespaceHook(namespace);
  return render(
    <MemoryRouter
      initialEntries={[`/ns/${namespace}/applications/${applicationName}/commit/${commitName}`]}
    >
      <Routes>
        <Route path={commitRoutePath} element={ui} />
      </Routes>
    </MemoryRouter>,
  );
};

describe('CommitPipelineRunsList', () => {
  const createMockTestPipelineRun = (
    name: string,
    componentName: string,
    startTime?: string,
  ): PipelineRunKind =>
    ({
      apiVersion: 'tekton.dev/v1',
      kind: 'PipelineRun',
      metadata: {
        name,
        namespace: mockNamespace,
        creationTimestamp: startTime ?? '2024-01-01T10:00:00Z',
        labels: {
          [PipelineRunLabel.APPLICATION]: mockApplication,
          [PipelineRunLabel.COMPONENT]: componentName,
          [PipelineRunLabel.PIPELINE_TYPE]: PipelineRunType.TEST,
        },
      },
      spec: {},
      status: {
        startTime: startTime ?? '2024-01-01T10:00:00Z',
        completionTime: '2024-01-01T10:05:00Z',
        conditions: [{ type: 'Succeeded', status: 'True' }],
        pipelineSpec: { tasks: [] },
      },
    }) as unknown as PipelineRunKind;

  const defaultHookReturn = (
    pipelineRuns: PipelineRunKind[] = [],
    loaded = true,
  ): ReturnType<typeof usePipelineRunsForCommitV2> => [
    pipelineRuns,
    loaded,
    null,
    jest.fn(),
    { hasNextPage: false, isFetchingNextPage: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNamespaceHook(mockNamespace);
  });

  describe('when route params or data are not ready', () => {
    it('should render nothing when not loaded', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([], false));

      const { container } = renderWithRouter(<CommitPipelineRunsList />);

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when applicationName is missing', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue(
        defaultHookReturn([createMockTestPipelineRun('plr-1', 'comp-a')]),
      );

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const { container } = renderWithRouter(<CommitPipelineRunsList />, {
        applicationName: '',
      });
      expect(container.firstChild).toBeNull();
      warnSpy.mockRestore();
    });

    it('should render nothing when commitName is missing', () => {
      mockUseNamespaceHook(mockNamespace);
      mockUsePipelineRunsForCommitV2.mockReturnValue(
        defaultHookReturn([createMockTestPipelineRun('plr-1', 'comp-a')]),
      );

      const { container } = render(
        <MemoryRouter initialEntries={['/ns/ws/applications/myapp/commit']}>
          <Routes>
            <Route
              path="/ns/:workspaceName/applications/:applicationName/commit/:commitName?"
              element={<CommitPipelineRunsList />}
            />
          </Routes>
        </MemoryRouter>,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when pipeline runs list is empty', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([]));

      const { container } = renderWithRouter(<CommitPipelineRunsList />);

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when filtered by componentName yields no runs', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue(
        defaultHookReturn([
          createMockTestPipelineRun('plr-a', 'component-a'),
          createMockTestPipelineRun('plr-b', 'component-b'),
        ]),
      );

      const { container } = renderWithRouter(
        <CommitPipelineRunsList componentName="component-c" />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when hook returns an error', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue([
        [createMockTestPipelineRun('plr-1', 'comp')],
        true,
        new Error('Failed to load'),
        jest.fn(),
        { hasNextPage: false, isFetchingNextPage: false },
      ]);

      const { container } = renderWithRouter(<CommitPipelineRunsList />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('hook invocation', () => {
    it('should call usePipelineRunsForCommitV2 with TEST type for integration tests', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([]));

      renderWithRouter(<CommitPipelineRunsList />);

      expect(mockUsePipelineRunsForCommitV2).toHaveBeenCalledWith(
        mockNamespace,
        mockApplication,
        mockCommit,
        undefined,
        false,
        PipelineRunType.TEST,
      );
    });
  });

  describe('when integration test pipeline runs are loaded', () => {
    it('should render "Integration tests" section with pipeline run list', () => {
      const plr1 = createMockTestPipelineRun('app-enterprise-contract-xyz', 'my-component');
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([plr1]));

      renderWithRouter(<CommitPipelineRunsList />);

      expect(screen.getByText('Integration tests')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'app-enterprise-contract-xyz' })).toBeInTheDocument();
    });

    it('should render each pipeline run with correct details link', () => {
      const plrName = 'app-ec-abc12';
      const plr = createMockTestPipelineRun(plrName, 'my-component');
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([plr]));

      renderWithRouter(<CommitPipelineRunsList />);

      const link = screen.getByRole('link', { name: plrName });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        'href',
        `/ns/${mockNamespace}/applications/${mockApplication}/pipelineruns/${plrName}`,
      );
    });

    it('should filter to only pipeline runs for the given component when componentName is set', () => {
      const compAPlr = createMockTestPipelineRun('plr-comp-a-1', 'component-a');
      const compBPlr = createMockTestPipelineRun('plr-comp-b-1', 'component-b');
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([compAPlr, compBPlr]));

      renderWithRouter(<CommitPipelineRunsList componentName="component-a" />);

      expect(screen.getByRole('link', { name: 'plr-comp-a-1' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'plr-comp-b-1' })).not.toBeInTheDocument();
    });

    it('should show all test pipeline runs when componentName is not set', () => {
      const plr1 = createMockTestPipelineRun('plr-1', 'component-a');
      const plr2 = createMockTestPipelineRun('plr-2', 'component-b');
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([plr1, plr2]));

      renderWithRouter(<CommitPipelineRunsList />);

      expect(screen.getByRole('link', { name: 'plr-1' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'plr-2' })).toBeInTheDocument();
    });

    it('should render pipeline runs in the order returned by the hook', () => {
      const plr1 = createMockTestPipelineRun('plr-first', 'my-component');
      const plr2 = createMockTestPipelineRun('plr-second', 'my-component');
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([plr1, plr2]));

      renderWithRouter(<CommitPipelineRunsList componentName="my-component" />);

      expect(screen.getByRole('link', { name: 'plr-first' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'plr-second' })).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('should exclude pipeline runs without metadata.name from the list', () => {
      const validPlr = createMockTestPipelineRun('valid-plr', 'my-component');
      const noNamePlr = {
        ...createMockTestPipelineRun('ignored', 'my-component'),
        metadata: { ...createMockTestPipelineRun('x', 'y').metadata, name: undefined },
      } as PipelineRunKind;
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([validPlr, noNamePlr]));

      renderWithRouter(<CommitPipelineRunsList />);

      expect(screen.getByRole('link', { name: 'valid-plr' })).toBeInTheDocument();
      expect(screen.queryByText('ignored')).not.toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    it('should render pipeline run rows with data-test attribute for automation', () => {
      const plrName = 'integration-test-run-xyz';
      mockUsePipelineRunsForCommitV2.mockReturnValue(
        defaultHookReturn([createMockTestPipelineRun(plrName, 'comp')]),
      );

      renderWithRouter(<CommitPipelineRunsList />);

      expect(screen.getByTestId(`pipeline-run-row-${plrName}`)).toBeInTheDocument();
    });
  });

  describe('accessibility and structure', () => {
    it('should render list with accessible structure (term and list)', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue(
        defaultHookReturn([createMockTestPipelineRun('plr-1', 'comp')]),
      );

      renderWithRouter(<CommitPipelineRunsList />);

      expect(screen.getByText('Integration tests')).toBeInTheDocument();
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
  });
});
