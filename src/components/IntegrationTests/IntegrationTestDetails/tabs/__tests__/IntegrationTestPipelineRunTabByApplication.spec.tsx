import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { mockTestPipelinesData } from '~/components/ApplicationDetails/__data__';
import { IntegrationTestLabels } from '~/components/IntegrationTests/IntegrationTestForm/types';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunsV2 } from '~/hooks/usePipelineRunsV2';
import {
  createUseParamsMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
} from '~/unit-test-utils';
import { IntegrationTestPipelineRunTabByApplication } from '../IntegrationTestPipelineRunTabByApplication';

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunsV2: jest.fn(),
}));

const usePipelineRunsV2Mock = usePipelineRunsV2 as jest.Mock;
const useParamsMock = createUseParamsMock();
mockUseNamespaceHook('test-ns');

const nextPageProps = { isFetchingNextPage: false, hasNextPage: false };

describe('IntegrationTestPipelineRunTabByApplication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useParamsMock.mockReturnValue({
      applicationName: 'test-app',
      integrationTestName: 'integration-test-one',
    });
    usePipelineRunsV2Mock.mockReturnValue([[], false, undefined, jest.fn(), nextPageProps]);
  });

  it('should query pipeline runs filtered by application and scenario labels', () => {
    renderWithQueryClientAndRouter(<IntegrationTestPipelineRunTabByApplication />);
    expect(usePipelineRunsV2Mock).toHaveBeenCalledWith(
      'test-ns',
      expect.objectContaining({
        selector: {
          matchLabels: {
            [PipelineRunLabel.APPLICATION]: 'test-app',
            [IntegrationTestLabels.SCENARIO]: 'integration-test-one',
          },
        },
      }),
    );
  });

  it('should render the progressbar while loading', () => {
    renderWithQueryClientAndRouter(<IntegrationTestPipelineRunTabByApplication />);
    screen.getByRole('progressbar');
  });

  it('should render the application empty state when there are no pipeline runs', () => {
    usePipelineRunsV2Mock.mockReturnValue([[], true, undefined, jest.fn(), nextPageProps]);
    renderWithQueryClientAndRouter(<IntegrationTestPipelineRunTabByApplication />);
    screen.getByText('Add component');
  });

  it('should render the pipeline runs list', () => {
    usePipelineRunsV2Mock.mockReturnValue([
      mockTestPipelinesData,
      true,
      undefined,
      jest.fn(),
      nextPageProps,
    ]);
    renderWithQueryClientAndRouter(<IntegrationTestPipelineRunTabByApplication />);
    screen.getByLabelText('Pipeline run List');
  });
});
