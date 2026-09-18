import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { mockTestPipelinesData } from '~/components/ApplicationDetails/__data__';
import type { PipelineRunKind } from '~/types';
import { createUseParamsMock } from '~/unit-test-utils';
import IntegrationTestPipelineRunTab from '../IntegrationTestPipelineRunTab';

createUseParamsMock({ applicationName: 'test-app', integrationTestName: 'integration-test-one' });

const defaultProps: ComponentProps<typeof IntegrationTestPipelineRunTab> = {
  pipelineRuns: [],
  loaded: false,
  error: undefined,
  getNextPage: jest.fn(),
  nextPageProps: { isFetchingNextPage: false, hasNextPage: false },
  persistedColumnKey: 'integration-test-pipeline-runs-columns-test-app-integration-test-one',
  PipelineRunEmptyState: () => <div>Custom empty state</div>,
};

describe('Integration Pipelinerun List', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the progressbar if it is still loading', () => {
    render(<IntegrationTestPipelineRunTab {...defaultProps} />);
    screen.getByRole('progressbar');
  });

  it('should render the error state incase of any API errors', () => {
    render(<IntegrationTestPipelineRunTab {...defaultProps} loaded error={{ code: 500 }} />);
    screen.getByText('Unable to load pipeline runs');
  });

  it('should render the provided empty state if there are no pipelineruns available', () => {
    render(<IntegrationTestPipelineRunTab {...defaultProps} loaded />);
    screen.getByText('Custom empty state');
  });

  it('should render the pipelineruns list', () => {
    render(
      <IntegrationTestPipelineRunTab
        {...defaultProps}
        loaded
        pipelineRuns={mockTestPipelinesData as unknown as PipelineRunKind[]}
      />,
    );
    screen.getByLabelText('Pipeline run List');
  });
});
