import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createUseParamsMock, routerRenderer } from '~/unit-test-utils/mock-react-router';
import { PipelineRunDetailsView } from '../PipelineRunDetailsView';

const mockPipelineRun: PipelineRunKind = {
  apiVersion: 'tekton.dev/v1',
  kind: 'PipelineRun',
  metadata: {
    name: 'test-pipeline-run',
    namespace: 'test-namespace',
    labels: {
      [PipelineRunLabel.APPLICATION]: 'test-app',
      [PipelineRunLabel.PIPELINE_NAME]: 'test-pipeline',
    },
  },
  spec: {},
  status: {
    conditions: [
      {
        type: 'Succeeded',
        status: 'True',
        reason: 'Completed',
      },
    ],
  },
} as unknown as PipelineRunKind;

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

// Mock the DetailsPage component
jest.mock('../../../DetailsPage', () => ({
  DetailsPage: jest.fn(({ headTitle, title, tabs, actions, breadcrumbs }) => (
    <div data-test="details-page">
      <div data-test="head-title">{headTitle}</div>
      <div data-test="title">{title}</div>
      <div data-test="tabs-count">{tabs?.length || 0}</div>
      <div data-test="actions-count">{actions?.length || 0}</div>
      <div data-test="breadcrumbs-count">{breadcrumbs?.length || 0}</div>
    </div>
  )),
}));

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
    mockUsePipelineRunV2.mockReturnValue([null, false, undefined]);

    routerRenderer(<PipelineRunDetailsView />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('details-page')).not.toBeInTheDocument();
  });

  it('should call usePipelineRunV2 with correct parameters', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);

    routerRenderer(<PipelineRunDetailsView />);

    expect(mockUsePipelineRunV2).toHaveBeenCalledWith(mockNamespace, mockPipelineRunName);
  });

  it('should render error state when pipeline run fails to load', () => {
    const mockError = { message: 'Pipeline run not found', code: 404 };
    mockUsePipelineRunV2.mockReturnValue([null, true, mockError]);

    routerRenderer(<PipelineRunDetailsView />);

    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
    expect(screen.queryByTestId('details-page')).not.toBeInTheDocument();
  });

  it('should render DetailsPage when pipeline run is loaded', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);

    routerRenderer(<PipelineRunDetailsView />);

    expect(screen.getByTestId('details-page')).toBeInTheDocument();
    expect(screen.getByTestId('head-title')).toHaveTextContent(mockPipelineRunName);
  });

  it('should render standard tabs for non-enterprise-contract pipeline', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);

    routerRenderer(<PipelineRunDetailsView />);

    // Should have 3 tabs: Details, Task runs, Logs (no Security tab)
    expect(screen.getByTestId('tabs-count')).toHaveTextContent('3');
  });

  it('should render Security tab for enterprise-contract pipeline', () => {
    mockUsePipelineRunV2.mockReturnValue([mockEnterpriseContractPipelineRun, true, undefined]);

    routerRenderer(<PipelineRunDetailsView />);

    // Should have 4 tabs: Details, Task runs, Logs, Security
    expect(screen.getByTestId('tabs-count')).toHaveTextContent('4');
  });

  it('should render actions (rerun, stop, cancel)', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);

    routerRenderer(<PipelineRunDetailsView />);

    // Should have 3 actions: rerun, stop, cancel
    expect(screen.getByTestId('actions-count')).toHaveTextContent('3');
  });

  it('should check access review for PipelineRunModel', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);

    routerRenderer(<PipelineRunDetailsView />);

    expect(mockUseAccessReviewForModel).toHaveBeenCalled();
  });

  it('should handle query param for releaseName', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);

    routerRenderer(<PipelineRunDetailsView />, {
      path: '/workspace/:workspaceName/application/:applicationName/pipelinerun/:pipelineRunName',
      initialEntries: [
        '/workspace/test-namespace/application/test-app/pipelinerun/test-pipeline-run?releaseName=test-release',
      ],
    });

    expect(screen.getByTestId('details-page')).toBeInTheDocument();
  });

  it('should handle query param for integrationTestName', () => {
    mockUsePipelineRunV2.mockReturnValue([mockPipelineRun, true, undefined]);

    routerRenderer(<PipelineRunDetailsView />, {
      path: '/workspace/:workspaceName/application/:applicationName/pipelinerun/:pipelineRunName',
      initialEntries: [
        '/workspace/test-namespace/application/test-app/pipelinerun/test-pipeline-run?integrationTestName=test-integration',
      ],
    });

    expect(screen.getByTestId('details-page')).toBeInTheDocument();
  });
});
