import { screen } from '@testing-library/react';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { useIsOnFeatureFlag } from '../../../../feature-flags/hooks';
import { useTRTaskRuns } from '../../../../hooks/useTektonResults';
import { useKubearchiveGetResourceQuery } from '../../../../kubearchive/hooks';
import { renderWithQueryClientAndRouter } from '../../../../unit-test-utils/rendering-utils';
import { createK8sWatchResourceMock } from '../../../../utils/test-utils';
import { testTaskRuns } from '../../../TaskRunListView/__data__/mock-TaskRun-data';
import TaskRunDetailsTab from '../TaskRunDetailsTab';

jest.mock('../../../../hooks/useTektonResults');
jest.mock('../../../../kubearchive/hooks');
jest.mock('../../../../feature-flags/hooks');

jest.mock('../../../topology/factories/VisualizationFactory', () => () => <div />);

const watchResourceMock = createK8sWatchResourceMock();

const mockUseKubearchiveGetResourceQuery = useKubearchiveGetResourceQuery as jest.Mock;
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockUseTRTaskRuns = useTRTaskRuns as jest.Mock;

describe('TaskRunDetailsTab', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    // Mock feature flag to disable kubearchive for simplicity
    mockUseIsOnFeatureFlag.mockReturnValue(false);

    // Mock kubearchive hook to return no data
    mockUseKubearchiveGetResourceQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    });

    // Mock tekton results hook to return no data
    mockUseTRTaskRuns.mockReturnValue([[], true, null]);
  });

  it('should render the taskrun details tab', () => {
    watchResourceMock.mockReturnValue([testTaskRuns[0], true]);
    renderWithQueryClientAndRouter(<TaskRunDetailsTab />);
    expect(screen.queryByText('Task run details')).toBeInTheDocument();
  });

  it('should render the taskrun details tab for embeddedt taskrun', () => {
    watchResourceMock.mockReturnValue([testTaskRuns[0], true]);
    renderWithQueryClientAndRouter(<TaskRunDetailsTab />);
    expect(screen.queryByText('Task run details')).toBeInTheDocument();
  });

  it('should render the taskrun and task name and description', () => {
    watchResourceMock.mockReturnValue([testTaskRuns[0], true]);
    renderWithQueryClientAndRouter(<TaskRunDetailsTab />);
    expect(screen.queryByText('example')).toBeInTheDocument();
    expect(screen.queryByText('example-task')).toBeInTheDocument();
    expect(screen.queryByText('Task description goes here.')).toBeInTheDocument();
  });

  it('should render the plr link', () => {
    watchResourceMock.mockReturnValue([testTaskRuns[0], true]);
    renderWithQueryClientAndRouter(<TaskRunDetailsTab />);
    expect(screen.queryByRole('link', { name: /example-pipelinerun/ })).toBeInTheDocument();
  });

  it('should render application link', () => {
    watchResourceMock.mockReturnValue([testTaskRuns[0], true]);
    renderWithQueryClientAndRouter(<TaskRunDetailsTab />);
    expect(screen.queryByRole('link', { name: /example-app/ })).toBeInTheDocument();
  });

  it('should render log link', () => {
    watchResourceMock.mockReturnValue([testTaskRuns[0], true]);
    renderWithQueryClientAndRouter(<TaskRunDetailsTab />);
    expect(screen.queryByRole('link', { name: /logs/ })).toBeInTheDocument();
  });

  it('should render RunParamsList when spec params are available', () => {
    const taskRunWithParams = {
      ...testTaskRuns[0],
      spec: {
        ...testTaskRuns[0].spec,
        params: [
          { name: 'taskParam1', value: 'taskValue1' },
          { name: 'taskParam2', value: 123 },
        ],
      },
    };
    watchResourceMock.mockReturnValue([taskRunWithParams, true]);
    renderWithQueryClientAndRouter(<TaskRunDetailsTab />);

    expect(screen.getByTestId('run-params-list')).toBeInTheDocument();
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('taskParam1')).toBeInTheDocument();
    expect(screen.getByText('taskValue1')).toBeInTheDocument();
    expect(screen.getByText('taskParam2')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('should not render RunParamsList when spec params are not available', () => {
    const taskRunWithoutParams = {
      ...testTaskRuns[0],
      spec: {
        ...testTaskRuns[0].spec,
        params: undefined,
      },
    };
    watchResourceMock.mockReturnValue([taskRunWithoutParams, true]);
    renderWithQueryClientAndRouter(<TaskRunDetailsTab />);

    expect(screen.queryByTestId('run-params-list')).not.toBeInTheDocument();
  });

  it('should not render RunParamsList when spec params array is empty', () => {
    const taskRunWithEmptyParams = {
      ...testTaskRuns[0],
      spec: {
        ...testTaskRuns[0].spec,
        params: [],
      },
    };
    watchResourceMock.mockReturnValue([taskRunWithEmptyParams, true]);
    renderWithQueryClientAndRouter(<TaskRunDetailsTab />);

    expect(screen.queryByTestId('run-params-list')).not.toBeInTheDocument();
  });
});
