import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { testPipelineRuns, DataState } from '~/__data__/pipelinerun-data';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createPipelineRunMockStates } from '~/unit-test-utils/mock-pipelinerun-test-utils';
import { createUseParamsMock, routerRenderer } from '~/unit-test-utils/mock-react-router';
import { PipelineRunDetailsView } from '../PipelineRunDetailsView';

// Reuse existing mock data from src/__data__/pipelinerun-data.ts
const mockPipelineRun: PipelineRunKind = {
  ...testPipelineRuns[DataState.SUCCEEDED],
  metadata: {
    ...testPipelineRuns[DataState.SUCCEEDED].metadata,
    name: 'test-pipeline-run',
    namespace: 'test-namespace',
    labels: {
      ...testPipelineRuns[DataState.SUCCEEDED].metadata.labels,
      [PipelineRunLabel.APPLICATION]: 'test-app',
      [PipelineRunLabel.PIPELINE_NAME]: 'test-pipeline',
    },
  },
};

const mockEnterpriseContractPipelineRun: PipelineRunKind = {
  ...mockPipelineRun,
  metadata: {
    ...mockPipelineRun.metadata,
    labels: {
      ...mockPipelineRun.metadata.labels,
      [PipelineRunLabel.PIPELINE_NAME]: 'enterprise-contract',
      'build.appstudio.redhat.com/pipeline': 'enterprise-contract',
    },
  },
};

const mockUsePipelineRunV2 = jest.fn();
const mockUsePipelinererunAction = jest.fn();
const mockUseAccessReviewForModel = jest.fn();

jest.mock('../../../../hooks/usePipelineRunsV2', () => ({
  usePipelineRunV2: (...args: unknown[]) => mockUsePipelineRunV2(...args),
}));

jest.mock('../../PipelineRunListView/pipelinerun-actions', () => ({
  usePipelinererunAction: (...args: unknown[]) => mockUsePipelinererunAction(...args),
}));

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: (...args: unknown[]) => mockUseAccessReviewForModel(...args),
}));

// Shared mock state helpers
const mockPipelineRunStates = createPipelineRunMockStates();

// We are testing:
// component composition, loading/error states, tab rendering logic, action setup, query param handling
describe('PipelineRunDetailsView', () => {
  const mockNamespace = 'test-namespace';
  const mockPipelineRunName = 'test-pipeline-run';

  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);
  const useParamsMock = createUseParamsMock();

  beforeEach(() => {
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue(mockNamespace);
    useParamsMock.mockReturnValue({ pipelineRunName: mockPipelineRunName });
    mockUsePipelinererunAction.mockReturnValue({
      cta: jest.fn(),
      isDisabled: false,
      disabledTooltip: '',
      key: 'rerun',
      label: 'Rerun',
    });
    mockUseAccessReviewForModel.mockReturnValue([true, true]);
  });

  it('should render spinner when loading pipeline run', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loading());

    routerRenderer(<PipelineRunDetailsView />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should call usePipelineRunV2 with correct parameters', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));

    routerRenderer(<PipelineRunDetailsView />);

    expect(mockUsePipelineRunV2).toHaveBeenCalledWith(mockNamespace, mockPipelineRunName);
  });

  it('should render error state when pipeline run fails to load', () => {
    mockUsePipelineRunV2.mockReturnValue(
      mockPipelineRunStates.error({ message: 'Pipeline run not found', code: 404 }),
    );

    routerRenderer(<PipelineRunDetailsView />);

    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
  });

  it('should render DetailsPage when pipeline run is loaded', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));

    routerRenderer(<PipelineRunDetailsView />);

    // Find the breadcrumb navigation and verify it contains the pipeline run name
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(breadcrumb).toHaveTextContent(mockPipelineRunName);
    expect(breadcrumb).toHaveTextContent('Pipeline runs');

    // Find the status label and verify it shows success
    const statusLabel = screen.getByText('Succeeded').closest('.pf-v5-c-label');
    expect(statusLabel).toHaveClass('pf-m-green');
    expect(statusLabel).toHaveTextContent('Succeeded');

    // Find the Details tab and verify it's present
    const detailsTab = screen.getByRole('tab', { name: /details/i });
    expect(detailsTab).toBeInTheDocument();
  });

  it('should render standard tabs for non-enterprise-contract pipeline', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));

    routerRenderer(<PipelineRunDetailsView />);

    // Should have Details, Task runs, Logs tabs
    expect(screen.getByRole('tab', { name: /details/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /task runs/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /logs/i })).toBeInTheDocument();
    // Should not have Security tab
    expect(screen.queryByRole('tab', { name: /security/i })).not.toBeInTheDocument();
  });

  it('should render Security tab for enterprise-contract pipeline', () => {
    mockUsePipelineRunV2.mockReturnValue(
      mockPipelineRunStates.loaded(mockEnterpriseContractPipelineRun),
    );

    routerRenderer(<PipelineRunDetailsView />);

    // Should have Details, Task runs, Logs, and Security tabs
    expect(screen.getByRole('tab', { name: /details/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /task runs/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /logs/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /security/i })).toBeInTheDocument();
  });

  it('should check access review for PipelineRunModel', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));

    routerRenderer(<PipelineRunDetailsView />);

    expect(mockUseAccessReviewForModel).toHaveBeenCalled();
  });

  it('should render DetailsPage with pipeline run data', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));

    routerRenderer(<PipelineRunDetailsView />);

    // Find the breadcrumb and verify it shows the pipeline run name
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(breadcrumb).toHaveTextContent('test-pipeline-run');

    // Find the actions button and verify it's enabled
    const actionsButton = screen.getByRole('button', { name: /actions/i });
    expect(actionsButton).not.toBeDisabled();

    // Find the status label and verify it shows the correct status
    const statusLabel = screen.getByText('Succeeded').closest('.pf-v5-c-label');
    expect(statusLabel).toHaveClass('pf-m-green');
  });
});
