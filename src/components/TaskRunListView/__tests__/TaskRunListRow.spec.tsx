import { render } from '@testing-library/react';
import { DataState, testPipelineRuns } from '~/__data__/pipelinerun-data';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { mockUseNamespaceHook } from '~/unit-test-utils';
import { testTaskRuns } from '../__data__/mock-TaskRun-data';
import TaskRunListRow from '../TaskRunListRow';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

describe('TaskRunListRow', () => {
  mockUseNamespaceHook('team');

  it.each([
    [undefined, '/ns/team/pipelineruns/build/taskruns/compile'],
    ['app', '/ns/team/applications/app/taskruns/compile'],
  ])('links using the parent application label %s', (applicationName, href) => {
    const parent = {
      ...testPipelineRuns[DataState.SUCCEEDED],
      metadata: { name: 'build', labels: { [PipelineRunLabel.APPLICATION]: applicationName } },
    };
    const view = render(
      <TaskRunListRow
        obj={{ ...testTaskRuns[0], metadata: { name: 'compile' } }}
        columns={[]}
        customData={{ pipelineRun: parent }}
      />,
      { container: document.createElement('tr') },
    );
    expect(view.getByRole('link', { name: 'compile' })).toHaveAttribute('href', href);
  });

  it('should render task info', () => {
    const wrapper = render(<TaskRunListRow obj={testTaskRuns[0]} columns={[]} />, {
      container: document.createElement('tr'),
    });
    const cells = wrapper.container.getElementsByTagName('td');
    const status = wrapper.getAllByTestId('taskrun-status');

    expect(cells[0].children[0].innerHTML).toBe(testTaskRuns[0].metadata.name);
    expect(cells[1].innerHTML).toBe(testTaskRuns[0].spec.taskRef.name);
    expect(status[0].innerHTML).toBe('Failed');
  });
});
