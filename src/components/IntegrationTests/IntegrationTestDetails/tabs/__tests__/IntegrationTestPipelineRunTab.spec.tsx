import { render, screen } from '@testing-library/react';
import { usePipelineRunsV2 } from '../../../../../hooks/usePipelineRunsV2';
import { createUseParamsMock } from '../../../../../utils/test-utils';
import { mockTestPipelinesData } from '../../../../ApplicationDetails/__data__';
import IntegrationTestPipelineRunTab from '../IntegrationTestPipelineRunTab';

jest.mock('../../../../../hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

const usePipelineRunsV2Mock = usePipelineRunsV2 as jest.Mock;

createUseParamsMock({ applicationName: 'test-app', integrationTestName: 'integration-test-one' });

describe('Integration Pipelinerun List', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the progressbar if it is still loading', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      false,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<IntegrationTestPipelineRunTab />);
    screen.getByRole('progressbar');
  });

  it('should render the error state incase of any API errors', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      { code: 500 },
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<IntegrationTestPipelineRunTab />);
    screen.getByText('Unable to load pipeline runs');
  });

  it('should render the empty state if there is not any pipelineruns available', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      [],
      true,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<IntegrationTestPipelineRunTab />);
    screen.getByText('Add component');
  });

  it('should render the pipelineruns list', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      mockTestPipelinesData,
      true,
      undefined,
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<IntegrationTestPipelineRunTab />);
    screen.getByLabelText('Pipeline run List');
  });
});
