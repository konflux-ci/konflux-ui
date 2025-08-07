import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { IntegrationTestScenarioModel, PipelineRunModel } from '../../../../models';
import { IntegrationTestScenarioKind } from '../../../../types/coreBuildService';
import { K8sModelCommon, WatchK8sResource } from '../../../../types/k8s';
import {
  createK8sWatchResourceMock,
  createTestQueryClient,
  createUseParamsMock,
} from '../../../../utils/test-utils';
import { mockPipelineRuns } from '../../../ApplicationDetails/__data__/mock-pipeline-run';
import { MockIntegrationTestsWithGit } from '../../IntegrationTestsListView/__data__/mock-integration-tests';
import IntegrationTestDetailsView from '../IntegrationTestDetailsView';

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

const watchResourceMock = createK8sWatchResourceMock();

const mockIntegrationTests: IntegrationTestScenarioKind[] = [...MockIntegrationTestsWithGit];

const useParamsMock = createUseParamsMock();

const getMockedResources = (params: WatchK8sResource, model: K8sModelCommon) => {
  if (model.kind === IntegrationTestScenarioModel.kind) {
    return {
      data: mockIntegrationTests.find((t) => !params.name || t.metadata.name === params.name),
      isLoading: false,
    };
  }
  if (model.kind === PipelineRunModel.kind) {
    return { data: [mockPipelineRuns], isLoading: false };
  }
  return { data: [], isLoading: false };
};

const renderComponent = () => {
  const queryClient = createTestQueryClient();
  return render(<IntegrationTestDetailsView />, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    ),
  });
};

describe('IntegrationTestDetailsView', () => {
  it('should render spinner if test data is not loaded', () => {
    watchResourceMock.mockReturnValue([[], false]);
    useParamsMock.mockReturnValue({ integrationTestName: 'int-test', applicationName: 'test-app' });
    renderComponent();
    screen.getByRole('progressbar');
  });

  it('should show error state if test cannot be loaded', () => {
    watchResourceMock.mockReturnValue([
      [],
      true,
      { message: 'Application does not exist', code: 404 },
    ]);
    useParamsMock.mockReturnValue({ integrationTestName: 'int-test', applicationName: 'test-app' });
    renderComponent();
    screen.getByText('404: Page not found');
  });

  it('should display test data when loaded', () => {
    watchResourceMock.mockImplementation(getMockedResources);
    useParamsMock.mockReturnValue({
      integrationTestName: 'test-app-test-1',
      applicationName: 'test-app',
    });
    renderComponent();
    screen.getAllByText('test-app-test-1');
  });

  it('should show error state if test is being deleted', () => {
    mockIntegrationTests[0].metadata.deletionTimestamp = '1';
    watchResourceMock.mockImplementation(getMockedResources);
    useParamsMock.mockReturnValue({
      integrationTestName: 'test-app-test-1',
      applicationName: 'test-app',
    });
    renderComponent();
    screen.getByText('404: Page not found');
  });
});
