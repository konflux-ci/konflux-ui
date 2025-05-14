import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { testTaskRuns } from '../__data__/mock-TaskRun-data';
import TaskRunListView from '../TaskRunListView';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

const TaskRunList = (taskRuns, loaded) => (
  <MemoryRouter>
    <FilterContextProvider filterParams={['name']}>
      <TaskRunListView taskRuns={taskRuns} loaded={loaded} />
    </FilterContextProvider>
  </MemoryRouter>
);

describe('TaskRunListView', () => {
  it('should render progress indicator while loading', async () => {
    const wrapper = render(TaskRunList([], false));
    expect(await wrapper.findByRole('progressbar')).toBeTruthy();
  });

  it('should render empty state when no TaskRuns present', () => {
    const wrapper = render(TaskRunList(testTaskRuns, true));
    expect(wrapper.findByText('No task runs found')).toBeTruthy();
  });

  it('should render table', () => {
    const wrapper = render(TaskRunList(testTaskRuns, true));
    const table = wrapper.container.getElementsByTagName('table');
    expect(table).toHaveLength(1);
  });

  it('should render filter toolbar', () => {
    const wrapper = render(TaskRunList(testTaskRuns, true));
    screen.getByTestId('taskrun-list-toolbar');
    expect(wrapper.container.getElementsByTagName('table')).toHaveLength(1);
    expect(wrapper.container.getElementsByTagName('tr')).toHaveLength(1);
  });
});
