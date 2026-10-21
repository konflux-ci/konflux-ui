import { screen, within } from '@testing-library/react';
import { TaskRunKind } from '~/types';
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

  describe('infrastructure diagnostic', () => {
    const message = 'Last observed Pod warning: FailedMount: secret "missing" not found';
    const taskRun: TaskRunKind = {
      ...testTaskRuns[0],
      status: {
        ...testTaskRuns[0].status,
        steps: [],
        conditions: [{ type: 'Succeeded', status: 'False', message }],
        results: [{ name: 'TEST_OUTPUT', value: 'Task result remains separate' }],
      },
    };

    it.each(['False', 'Unknown'])(
      'shows the exact warning for condition status %s without step logs',
      (status) => {
        watchResourceMock.mockReturnValue([
          {
            ...taskRun,
            status: { ...taskRun.status, conditions: [{ type: 'Succeeded', status, message }] },
          },
          true,
        ]);
        renderWithQueryClientAndRouter(<TaskRunDetailsTab />);
        const group = screen.getByText('Infrastructure diagnostic').closest('dt').parentElement;
        expect(within(group).getByText(message).textContent).toBe(message);
        if (status === 'Unknown') {
          expect(screen.queryByText('Log snippet')).not.toBeInTheDocument();
          expect(screen.getByText('TEST_OUTPUT')).toBeInTheDocument();
          expect(screen.getByText('Task result remains separate')).toBeInTheDocument();
        } else {
          expect(screen.getByText('Log snippet')).toBeInTheDocument();
          expect(screen.getByRole('link', { name: 'See logs' })).toBeInTheDocument();
          expect(screen.getByText('No results available due to failure')).toBeInTheDocument();
        }
      },
    );

    it.each([undefined, 'Task failed'])('omits the diagnostic for message %s', (value) => {
      watchResourceMock.mockReturnValue([
        {
          ...taskRun,
          status: { conditions: [{ type: 'Succeeded', status: 'False', message: value }] },
        },
        true,
      ]);
      renderWithQueryClientAndRouter(<TaskRunDetailsTab />);
      expect(screen.queryByText('Infrastructure diagnostic')).not.toBeInTheDocument();
    });

    it('removes the diagnostic when the current resource loses its warning', () => {
      watchResourceMock.mockReturnValue([taskRun, true]);
      const view = renderWithQueryClientAndRouter(<TaskRunDetailsTab />);
      expect(screen.getByText('Infrastructure diagnostic')).toBeInTheDocument();
      watchResourceMock.mockReturnValue([
        {
          ...taskRun,
          status: { conditions: [{ type: 'Succeeded', status: 'False', message: 'Task failed' }] },
        },
        true,
      ]);
      view.rerender(<TaskRunDetailsTab />);
      expect(screen.queryByText(message)).not.toBeInTheDocument();
      expect(screen.queryByText('Infrastructure diagnostic')).not.toBeInTheDocument();
    });

    it('preserves long Unicode, whitespace, and literal markup as text', () => {
      const literalMessage = `${message}\n  資源 ${'identifier'.repeat(100)} <img src=x onerror=alert(1)>  `;
      watchResourceMock.mockReturnValue([
        {
          ...taskRun,
          status: {
            conditions: [{ type: 'Succeeded', status: 'Unknown', message: literalMessage }],
          },
        },
        true,
      ]);
      const { container } = renderWithQueryClientAndRouter(<TaskRunDetailsTab />);
      expect(screen.getByText(literalMessage, { normalizer: (text) => text }).textContent).toBe(
        literalMessage,
      );
      expect(container.querySelector('img')).toBeNull();
    });
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
