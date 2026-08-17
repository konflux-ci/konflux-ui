import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { runStatus } from '~/consts/pipelinerun';
import { useTRTaskRunLog } from '~/hooks/useTektonResults';
import { TaskRunKind } from '~/types';
import { taskRunStatus } from '~/utils/pipeline-utils';
import { TektonTaskRunLog } from '../TektonTaskRunLog';

const mockLogViewer = jest.fn();

jest.mock('../LogViewer', () => {
  return function MockLogViewer(props: {
    sections: Array<{ containerName: string; data: string; isCompleted?: boolean }>;
    isLoading?: boolean;
    onScroll?: () => void;
  }) {
    mockLogViewer(props);
    return <div data-test="mock-log-viewer" />;
  };
});

jest.mock('~/hooks/useTektonResults', () => ({
  useTRTaskRunLog: jest.fn(),
}));

jest.mock('~/utils/pipeline-utils', () => ({
  taskRunStatus: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockTaskRun: TaskRunKind = {
  apiVersion: 'tekton.dev/v1beta1',
  kind: 'TaskRun',
  metadata: {
    name: 'test-taskrun',
    namespace: 'test-namespace',
    uid: 'test-uid',
  },
  spec: {
    taskRef: {
      name: 'test-task',
    },
  },
  status: {
    podName: 'test-pod',
  },
};

const getLastSections = (): Array<{ containerName: string; isCompleted?: boolean }> => {
  const lastCall = mockLogViewer.mock.calls[mockLogViewer.mock.calls.length - 1][0];
  return lastCall.sections || [];
};

describe('TektonTaskRunLog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTRTaskRunLog as jest.Mock).mockReturnValue(['pipeline log', true, undefined]);
  });

  it('should render logs container', () => {
    (taskRunStatus as jest.Mock).mockReturnValue(runStatus.Running);
    render(<TektonTaskRunLog taskRun={mockTaskRun} />);

    expect(screen.getByTestId('mock-log-viewer')).toBeInTheDocument();
  });

  it('should mark the section with hasTerminatedWithError when the task run failed', async () => {
    (taskRunStatus as jest.Mock).mockReturnValue(runStatus.Failed);
    render(<TektonTaskRunLog taskRun={mockTaskRun} />);

    await waitFor(() => {
      expect(getLastSections()[0]).toEqual(
        expect.objectContaining({
          containerName: 'test-task',
          data: 'pipeline log',
          isCompleted: true,
          hasTerminatedWithError: true,
        }),
      );
    });
  });

  it('should not mark the section with hasTerminatedWithError when the task run succeeded', async () => {
    (taskRunStatus as jest.Mock).mockReturnValue(runStatus.Succeeded);
    render(<TektonTaskRunLog taskRun={mockTaskRun} />);

    await waitFor(() => {
      expect(getLastSections()[0]).toEqual(
        expect.objectContaining({
          containerName: 'test-task',
          data: 'pipeline log',
          isCompleted: true,
          hasTerminatedWithError: false,
        }),
      );
    });
  });

  it('should keep the section incomplete while the task run is still running', async () => {
    (taskRunStatus as jest.Mock).mockReturnValue(runStatus.Running);
    render(<TektonTaskRunLog taskRun={mockTaskRun} />);

    await waitFor(() => {
      expect(getLastSections()[0]).toEqual(
        expect.objectContaining({
          containerName: 'test-task',
          data: 'pipeline log',
          isCompleted: false,
          hasTerminatedWithError: false,
        }),
      );
    });
  });

  it('should pass no sections while the log is loading', () => {
    (useTRTaskRunLog as jest.Mock).mockReturnValue(['', false, undefined]);
    (taskRunStatus as jest.Mock).mockReturnValue(runStatus.Running);
    render(<TektonTaskRunLog taskRun={mockTaskRun} />);

    expect(mockLogViewer).toHaveBeenCalledWith(
      expect.objectContaining({
        sections: [],
        isLoading: true,
      }),
    );
  });
});
