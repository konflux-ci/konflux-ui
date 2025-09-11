import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { createTestQueryClient } from '~/unit-test-utils/mock-react-query';
import { usePipelineRunsV2 } from '../../../../../hooks/usePipelineRunsV2';
import { createUseParamsMock } from '../../../../../utils/test-utils';
import { mockTestPipelinesData } from '../../../../ApplicationDetails/__data__';
import IntegrationTestPipelineRunTab from '../IntegrationTestPipelineRunTab';

jest.mock('../../../../../hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

jest.mock('~/kubearchive/hooks', () => ({
  useKubearchiveListResourceQuery: jest.fn(() => ({
    data: { pages: [] },
    isLoading: false,
    error: null,
    hasNextPage: false,
    fetchNextPage: jest.fn(),
    isFetchingNextPage: false,
  })),
}));

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(() => false),
  createConditionsHook: jest.fn(() => jest.fn(() => false)),
}));

jest.mock('~/feature-flags/utils', () => ({
  ensureConditionIsOn: jest.fn(() => jest.fn(() => false)),
}));

jest.mock('../../../../../hooks/useTektonResults', () => ({
  useTRPipelineRuns: jest.fn(() => [
    [],
    true,
    null,
    jest.fn(),
    { isFetchingNextPage: false, hasNextPage: false },
  ]),
  useTRTaskRuns: jest.fn(() => [
    [],
    true,
    null,
    jest.fn(),
    { isFetchingNextPage: false, hasNextPage: false },
  ]),
}));

jest.mock('~/k8s', () => ({
  useK8sWatchResource: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  commonFetch: jest.fn(() => Promise.resolve({})),
}));

const usePipelineRunsV2Mock = usePipelineRunsV2 as jest.Mock;

const TestComponent = () => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <IntegrationTestPipelineRunTab />
    </QueryClientProvider>
  );
};

createUseParamsMock({ applicationName: 'test-app', integrationTestName: 'integration-test-one' });

describe('Integration Pipelinerun List', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the progressbar if it is still loading', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      false,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<TestComponent />);
    screen.getByRole('progressbar');
  });

  it('should render the error state incase of any API errors', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      { code: 500 },
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<TestComponent />);
    screen.getByText('Unable to load pipeline runs');
  });

  it('should render the empty state if there is not any pipelineruns available', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<TestComponent />);
    screen.getByText('Add component');
  });

  it('should render the pipelineruns list', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      mockTestPipelinesData,
      true,
      null,
      jest.fn(),
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<TestComponent />);
    screen.getByLabelText('Pipeline run List');
  });
});
