import { render, screen } from '@testing-library/react';
import { usePipelineRuns } from '../../../../../hooks/usePipelineRuns';
import { createUseParamsMock } from '../../../../../utils/test-utils';
import { mockTestPipelinesData } from '../../../../ApplicationDetails/__data__';
import IntegrationTestPipelineRunTab from '../IntegrationTestPipelineRunTab';

jest.mock('../../../../../hooks/usePipelineRuns', () => ({
  usePipelineRuns: jest.fn(),
}));

const usePipelineRunsMock = usePipelineRuns as jest.Mock;

createUseParamsMock({ applicationName: 'test-app', integrationTestName: 'integration-test-one' });

describe('Integration Pipelinerun List', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the progressbar if it is still loading', () => {
    usePipelineRunsMock.mockReturnValue([
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
    usePipelineRunsMock.mockReturnValue([
      [],
      false,
      new Error('500: Internal server error'),
      undefined,
      { isFetchingNextPage: false, hasNextPage: false },
    ]);
    render(<IntegrationTestPipelineRunTab />);
    screen.getByText('Unable to load pipeline runs');
  });

  it('should render the empty state if there is not any pipelineruns available', () => {
    usePipelineRunsMock.mockReturnValue([
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
    usePipelineRunsMock.mockReturnValue([
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
