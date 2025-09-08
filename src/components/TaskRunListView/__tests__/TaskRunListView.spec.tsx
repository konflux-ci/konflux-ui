import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useTaskRunsForPipelineRuns } from '../../../hooks/useTaskRuns';
import { testTaskRuns } from '../__data__/mock-TaskRun-data';
import TaskRunListView from '../TaskRunListView';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../hooks/useTaskRuns');

const useTaskRunsForPipelineRunsMock = useTaskRunsForPipelineRuns as jest.Mock;

const TaskRunList = (taskRuns, loaded, error = null) => {
  useTaskRunsForPipelineRunsMock.mockReturnValue([taskRuns, loaded, error]);

  return (
    <MemoryRouter>
      <FilterContextProvider filterParams={['name']}>
        <TaskRunListView namespace="test-namespace" pipelineRunName="test-pipeline-run" />
      </FilterContextProvider>
    </MemoryRouter>
  );
};

describe('TaskRunListView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render progress indicator while loading', async () => {
    const wrapper = render(TaskRunList([], false));
    expect(await wrapper.findByRole('progressbar')).toBeTruthy();
  });

  it('should render empty state when no TaskRuns present', () => {
    const wrapper = render(TaskRunList([], true));
    expect(wrapper.queryByText('No task runs found')).toBeTruthy();
  });

  it('should render error state when there is an error', () => {
    const error = new Error('Test error');
    const wrapper = render(TaskRunList([], false, error));
    expect(wrapper.queryByText('Unable to load task runs')).toBeTruthy();
    expect(wrapper.queryByText('Test error')).toBeTruthy();
  });

  it('should render table when TaskRuns are present', () => {
    const wrapper = render(TaskRunList(testTaskRuns, true));
    const table = wrapper.container.getElementsByTagName('table');
    expect(table).toHaveLength(1);
  });

  it('should render filter toolbar', () => {
    const wrapper = render(TaskRunList(testTaskRuns, true));
    screen.getByTestId('taskrun-list-toolbar');
    expect(wrapper.container.getElementsByTagName('table')).toHaveLength(1);
  });

  it('should call useTaskRunsForPipelineRuns with correct parameters', () => {
    render(TaskRunList(testTaskRuns, true));

    expect(useTaskRunsForPipelineRunsMock).toHaveBeenCalledWith(
      'test-namespace',
      'test-pipeline-run',
      undefined,
    );
  });
});
