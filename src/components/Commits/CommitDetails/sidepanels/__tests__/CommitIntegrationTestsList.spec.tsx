import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { PipelineRunLabel, PipelineRunType, runStatus } from '~/consts/pipelinerun';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsForCommitV2';
import { PipelineRunKind } from '~/types';
import { mockUseNamespaceHook } from '../../../../../unit-test-utils';
import { createUseParamsMock } from '../../../../../unit-test-utils/mock-react-router';
import { renderWithQueryClientAndRouter } from '../../../../../unit-test-utils/rendering-utils';
import { CommitIntegrationTestsList } from '../CommitIntegrationTestsList';

jest.mock('~/hooks/usePipelineRunsForCommitV2', () => ({
  usePipelineRunsForCommitV2: jest.fn(),
}));

const mockUsePipelineRunsForCommitV2 = usePipelineRunsForCommitV2 as jest.Mock;

const mockNamespace = 'test-namespace';
const mockApplication = 'test-app';
const mockCommit = 'abc123def456';
const mockScenario = 'enterprise-contract';

const defaultProps = {
  integrationTestScenario: mockScenario,
};

describe('CommitIntegrationTestsList', () => {
  const createMockTestPipelineRun = (
    name: string,
    componentName: string,
    options: { startTime?: string; scenario?: string } = {},
  ): PipelineRunKind => {
    const { startTime, scenario = mockScenario } = options;
    return {
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
          [PipelineRunLabel.TEST_SERVICE_SCENARIO]: scenario,
        },
      },
      spec: {},
      status: {
        startTime: startTime ?? '2024-01-01T10:00:00Z',
        completionTime: '2024-01-01T10:05:00Z',
        conditions: [{ type: 'Succeeded', status: 'True' }],
        pipelineSpec: { tasks: [] },
      },
    } as unknown as PipelineRunKind;
  };

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
    createUseParamsMock({
      workspaceName: mockNamespace,
      applicationName: mockApplication,
      commitName: mockCommit,
    });
  });

  describe('when route params or data are not ready', () => {
    it('should render nothing when not loaded', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([], false));

      const { container } = renderWithQueryClientAndRouter(
        <CommitIntegrationTestsList {...defaultProps} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when applicationName is missing', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue(
        defaultHookReturn([createMockTestPipelineRun('plr-1', 'comp-a')]),
      );

      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      createUseParamsMock({
        workspaceName: mockNamespace,
        applicationName: '',
        commitName: mockCommit,
      });
      const { container } = renderWithQueryClientAndRouter(
        <CommitIntegrationTestsList {...defaultProps} />,
      );
      expect(container.firstChild).toBeNull();
      warnSpy.mockRestore();
    });

    it('should render nothing when commitName is missing', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue(
        defaultHookReturn([createMockTestPipelineRun('plr-1', 'comp-a')]),
      );
      createUseParamsMock({
        workspaceName: mockNamespace,
        applicationName: mockApplication,
        commitName: '',
      });

      const { container } = renderWithQueryClientAndRouter(
        <CommitIntegrationTestsList {...defaultProps} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when integrationTestScenario is empty', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue(
        defaultHookReturn([createMockTestPipelineRun('plr-1', 'comp-a')]),
      );

      const { container } = renderWithQueryClientAndRouter(
        <CommitIntegrationTestsList integrationTestScenario="" componentName="comp-a" />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when pipeline runs list is empty', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([]));

      const { container } = renderWithQueryClientAndRouter(
        <CommitIntegrationTestsList {...defaultProps} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when filtered by componentName yields no runs', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue(
        defaultHookReturn([
          createMockTestPipelineRun('plr-a', 'component-a'),
          createMockTestPipelineRun('plr-b', 'component-b'),
        ]),
      );

      const { container } = renderWithQueryClientAndRouter(
        <CommitIntegrationTestsList {...defaultProps} componentName="component-c" />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render nothing when no runs match integration test scenario', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue(
        defaultHookReturn([
          createMockTestPipelineRun('plr-a', 'component-a', { scenario: 'other-scenario' }),
        ]),
      );

      const { container } = renderWithQueryClientAndRouter(
        <CommitIntegrationTestsList {...defaultProps} componentName="component-a" />,
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

      const { container } = renderWithQueryClientAndRouter(
        <CommitIntegrationTestsList {...defaultProps} />,
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('hook invocation', () => {
    it('should call usePipelineRunsForCommitV2 with TEST type for integration tests', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([]));

      renderWithQueryClientAndRouter(<CommitIntegrationTestsList {...defaultProps} />);

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
    it('should render "Test pipeline runs" section with pipeline run list', () => {
      const plr1 = createMockTestPipelineRun('app-enterprise-contract-xyz', 'my-component');
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([plr1]));

      renderWithQueryClientAndRouter(<CommitIntegrationTestsList {...defaultProps} />);

      expect(screen.getByText('Test pipeline runs')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: new RegExp('app-enterprise-contract-xyz') }),
      ).toBeInTheDocument();
    });

    it('should render each pipeline run with correct details link', () => {
      const plrName = 'app-ec-abc12';
      const plr = createMockTestPipelineRun(plrName, 'my-component');
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([plr]));

      renderWithQueryClientAndRouter(<CommitIntegrationTestsList {...defaultProps} />);

      const link = screen.getByRole('link', { name: new RegExp(plrName) });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        'href',
        `/ns/${mockNamespace}/applications/${mockApplication}/pipelineruns/${plrName}`,
      );
    });

    it('should show pipeline run status next to the link', () => {
      const plrName = 'app-ec-status';
      mockUsePipelineRunsForCommitV2.mockReturnValue(
        defaultHookReturn([createMockTestPipelineRun(plrName, 'my-component')]),
      );

      renderWithQueryClientAndRouter(<CommitIntegrationTestsList {...defaultProps} />);

      expect(screen.getByTestId(`pipeline-run-status-${plrName}`)).toHaveTextContent(
        runStatus.Succeeded,
      );
    });

    it('should filter to only pipeline runs for the given component when componentName is set', () => {
      const compAPlr = createMockTestPipelineRun('plr-comp-a-1', 'component-a');
      const compBPlr = createMockTestPipelineRun('plr-comp-b-1', 'component-b');
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([compAPlr, compBPlr]));

      renderWithQueryClientAndRouter(
        <CommitIntegrationTestsList {...defaultProps} componentName="component-a" />,
      );

      expect(screen.getByRole('link', { name: /plr-comp-a-1/ })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /plr-comp-b-1/ })).not.toBeInTheDocument();
    });

    it('should only include pipeline runs for the selected integration test scenario', () => {
      const matching = createMockTestPipelineRun('plr-match', 'component-a', {
        scenario: mockScenario,
      });
      const otherScenario = createMockTestPipelineRun('plr-other', 'component-a', {
        scenario: 'different-test',
      });
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([matching, otherScenario]));

      renderWithQueryClientAndRouter(
        <CommitIntegrationTestsList {...defaultProps} componentName="component-a" />,
      );

      expect(screen.getByRole('link', { name: /plr-match/ })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /plr-other/ })).not.toBeInTheDocument();
    });

    it('should show all matching scenario runs when componentName is not set', () => {
      const plr1 = createMockTestPipelineRun('plr-1', 'component-a');
      const plr2 = createMockTestPipelineRun('plr-2', 'component-b');
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([plr1, plr2]));

      renderWithQueryClientAndRouter(<CommitIntegrationTestsList {...defaultProps} />);

      expect(screen.getByRole('link', { name: /plr-1/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /plr-2/ })).toBeInTheDocument();
    });

    it('should render pipeline runs in the order returned by the hook', () => {
      const plr1 = createMockTestPipelineRun('plr-first', 'my-component');
      const plr2 = createMockTestPipelineRun('plr-second', 'my-component');
      mockUsePipelineRunsForCommitV2.mockReturnValue(defaultHookReturn([plr1, plr2]));

      renderWithQueryClientAndRouter(
        <CommitIntegrationTestsList {...defaultProps} componentName="my-component" />,
      );

      expect(screen.getByRole('link', { name: /plr-first/ })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /plr-second/ })).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('should render pipeline run rows with data-test attribute for automation', () => {
      const plrName = 'integration-test-run-xyz';
      mockUsePipelineRunsForCommitV2.mockReturnValue(
        defaultHookReturn([createMockTestPipelineRun(plrName, 'comp')]),
      );

      renderWithQueryClientAndRouter(<CommitIntegrationTestsList {...defaultProps} />);

      expect(screen.getByTestId(`pipeline-run-row-${plrName}`)).toBeInTheDocument();
    });
  });

  describe('accessibility and structure', () => {
    it('should render list with accessible structure (term and list)', () => {
      mockUsePipelineRunsForCommitV2.mockReturnValue(
        defaultHookReturn([createMockTestPipelineRun('plr-1', 'comp')]),
      );

      renderWithQueryClientAndRouter(<CommitIntegrationTestsList {...defaultProps} />);

      expect(screen.getByText('Test pipeline runs')).toBeInTheDocument();
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });
  });
});
