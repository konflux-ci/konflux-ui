import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { testPipelineRuns, DataState } from '~/__data__/pipelinerun-data';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { PipelineRunGroupVersionKind } from '~/models';
import { PipelineRunKind } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createPipelineRunsForCommitMockStates } from '~/unit-test-utils/mock-pipelinerun-test-utils';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import RelatedPipelineRuns from '../RelatedPipelineRuns';

const mockUsePipelineRunsForCommitV2 = jest.fn();

jest.mock('../../../../hooks/usePipelineRunsForCommitV2', () => ({
  usePipelineRunsForCommitV2: (...args: unknown[]) => mockUsePipelineRunsForCommitV2(...args),
}));

// Shared mock state helpers
const mockPipelineRunsForCommitStates = createPipelineRunsForCommitMockStates();

// We are testing:
// loading states, related pipeline runs filtering/counting, popover display, link generation, edge cases (no sha, invalid kinds)
// Real implementations: commits-utils (getCommitSha)
describe('RelatedPipelineRuns', () => {
  const mockNamespace = 'test-namespace';
  const mockApplicationName = 'test-app';
  const mockSha = 'abc123def456';

  // Reuse existing mock data with customization
  const mockPipelineRun: PipelineRunKind = {
    ...testPipelineRuns[DataState.SUCCEEDED],
    metadata: {
      ...testPipelineRuns[DataState.SUCCEEDED].metadata,
      name: 'current-pipeline-run',
      namespace: mockNamespace,
      labels: {
        ...testPipelineRuns[DataState.SUCCEEDED].metadata.labels,
        [PipelineRunLabel.APPLICATION]: mockApplicationName,
        'pipelinesascode.tekton.dev/sha': mockSha,
      },
    },
  };

  const mockRelatedPipelineRun1: PipelineRunKind = {
    ...testPipelineRuns[DataState.SUCCEEDED],
    kind: PipelineRunGroupVersionKind.kind,
    metadata: {
      ...testPipelineRuns[DataState.SUCCEEDED].metadata,
      name: 'related-pipeline-run-1',
      namespace: mockNamespace,
      uid: 'uid-1',
      labels: {
        ...testPipelineRuns[DataState.SUCCEEDED].metadata.labels,
        [PipelineRunLabel.APPLICATION]: mockApplicationName,
      },
    },
  };

  const mockRelatedPipelineRun2: PipelineRunKind = {
    ...testPipelineRuns[DataState.SUCCEEDED],
    kind: PipelineRunGroupVersionKind.kind,
    metadata: {
      ...testPipelineRuns[DataState.SUCCEEDED].metadata,
      name: 'related-pipeline-run-2',
      namespace: mockNamespace,
      uid: 'uid-2',
      labels: {
        ...testPipelineRuns[DataState.SUCCEEDED].metadata.labels,
        [PipelineRunLabel.APPLICATION]: mockApplicationName,
      },
    },
  };

  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);

  beforeEach(() => {
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue(mockNamespace);
  });

  it('should render skeleton while loading related pipeline runs', () => {
    mockUsePipelineRunsForCommitV2.mockReturnValue(mockPipelineRunsForCommitStates.loading());

    renderWithQueryClientAndRouter(<RelatedPipelineRuns pipelineRun={mockPipelineRun} />);

    expect(screen.getByText('Loading related pipelines')).toBeInTheDocument();
  });

  it('should call usePipelineRunsForCommitV2 with correct parameters', () => {
    mockUsePipelineRunsForCommitV2.mockReturnValue(mockPipelineRunsForCommitStates.loaded([]));

    renderWithQueryClientAndRouter(<RelatedPipelineRuns pipelineRun={mockPipelineRun} />);

    expect(mockUsePipelineRunsForCommitV2).toHaveBeenCalledWith(
      mockNamespace,
      mockApplicationName,
      mockSha,
    );
  });

  it('should render "No related pipelines" when there are no related pipeline runs', async () => {
    mockUsePipelineRunsForCommitV2.mockReturnValue(
      mockPipelineRunsForCommitStates.loaded([mockPipelineRun]),
    );

    const user = userEvent.setup();
    renderWithQueryClientAndRouter(<RelatedPipelineRuns pipelineRun={mockPipelineRun} />);

    const button = screen.getByRole('button', { name: /0 pipelines/ });
    expect(button).toBeInTheDocument();

    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('No related pipelines')).toBeInTheDocument();
    });
  });

  it('should render "1 pipeline" when there is one related pipeline run', () => {
    mockUsePipelineRunsForCommitV2.mockReturnValue(
      mockPipelineRunsForCommitStates.loaded([mockPipelineRun, mockRelatedPipelineRun1]),
    );

    renderWithQueryClientAndRouter(<RelatedPipelineRuns pipelineRun={mockPipelineRun} />);

    expect(screen.getByRole('button', { name: /1 pipeline/ })).toBeInTheDocument();
  });

  it('should render "2 pipelines" when there are multiple related pipeline runs', () => {
    mockUsePipelineRunsForCommitV2.mockReturnValue(
      mockPipelineRunsForCommitStates.loaded([
        mockPipelineRun,
        mockRelatedPipelineRun1,
        mockRelatedPipelineRun2,
      ]),
    );

    renderWithQueryClientAndRouter(<RelatedPipelineRuns pipelineRun={mockPipelineRun} />);

    expect(screen.getByRole('button', { name: /2 pipelines/ })).toBeInTheDocument();
  });

  it('should display related pipeline runs in popover when button is clicked', async () => {
    mockUsePipelineRunsForCommitV2.mockReturnValue(
      mockPipelineRunsForCommitStates.loaded([
        mockPipelineRun,
        mockRelatedPipelineRun1,
        mockRelatedPipelineRun2,
      ]),
    );

    const user = userEvent.setup();
    renderWithQueryClientAndRouter(<RelatedPipelineRuns pipelineRun={mockPipelineRun} />);

    const button = screen.getByRole('button', { name: /2 pipelines/ });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'related-pipeline-run-1' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'related-pipeline-run-2' })).toBeInTheDocument();
    });
  });

  it('should filter out the current pipeline run from related pipeline runs', () => {
    mockUsePipelineRunsForCommitV2.mockReturnValue(
      mockPipelineRunsForCommitStates.loaded([mockPipelineRun, mockRelatedPipelineRun1]),
    );

    renderWithQueryClientAndRouter(<RelatedPipelineRuns pipelineRun={mockPipelineRun} />);

    // Should only show 1 related pipeline, not counting the current one
    expect(screen.getByRole('button', { name: /1 pipeline/ })).toBeInTheDocument();
  });

  it('should filter out non-PipelineRun kind resources', () => {
    const nonPipelineRun = {
      ...mockRelatedPipelineRun1,
      kind: 'SomeOtherKind',
    };

    mockUsePipelineRunsForCommitV2.mockReturnValue(
      mockPipelineRunsForCommitStates.loaded([
        mockPipelineRun,
        nonPipelineRun,
        mockRelatedPipelineRun2,
      ]),
    );

    renderWithQueryClientAndRouter(<RelatedPipelineRuns pipelineRun={mockPipelineRun} />);

    // Should only count the valid PipelineRun
    expect(screen.getByRole('button', { name: /1 pipeline/ })).toBeInTheDocument();
  });

  it('should render related pipeline runs with correct links', async () => {
    mockUsePipelineRunsForCommitV2.mockReturnValue(
      mockPipelineRunsForCommitStates.loaded([mockPipelineRun, mockRelatedPipelineRun1]),
    );

    const user = userEvent.setup();
    renderWithQueryClientAndRouter(<RelatedPipelineRuns pipelineRun={mockPipelineRun} />);

    const button = screen.getByRole('button', { name: /1 pipeline/ });
    await user.click(button);

    await waitFor(() => {
      const link = screen.getByRole('link', { name: 'related-pipeline-run-1' });
      expect(link).toHaveAttribute(
        'href',
        `/ns/${mockNamespace}/applications/${mockApplicationName}/pipelineruns/related-pipeline-run-1`,
      );
    });
  });

  it('should render popover when data is loaded without sha', () => {
    const pipelineRunWithoutSha = {
      ...mockPipelineRun,
      metadata: {
        ...mockPipelineRun.metadata,
        labels: {
          [PipelineRunLabel.APPLICATION]: mockApplicationName,
        },
      },
    };

    mockUsePipelineRunsForCommitV2.mockReturnValue(mockPipelineRunsForCommitStates.loading());

    renderWithQueryClientAndRouter(<RelatedPipelineRuns pipelineRun={pipelineRunWithoutSha} />);

    // Should render button immediately (not skeleton) when there's no sha
    expect(screen.getByRole('button', { name: /0 pipelines/ })).toBeInTheDocument();
  });
});
