import { ElementModel, GraphElement } from '@patternfly/react-topology';
import { screen } from '@testing-library/react';
import { DataState, testPipelineRuns } from '~/__data__/pipelinerun-data';
import { runStatus } from '~/consts/pipelinerun';
import { mockUseNamespaceHook, renderWithQueryClientAndRouter } from '~/unit-test-utils';
import TaskRunPanel from '../sidepanels/TaskRunPanel';
import { PipelineRunNodeData } from '../visualization/types';

jest.mock('../sidepanels/TaskRunDetails', () => () => <p>Task details</p>);
jest.mock('~/components/TaskRuns/TaskRunLogs', () => () => <p>Task logs</p>);
mockUseNamespaceHook('team');

it('links a graph task without application labels to its parent namespace route', () => {
  const taskNode = {
    getData: () => ({
      task: { name: 'compile' },
      taskRun: { metadata: { name: 'compile-1' } },
      status: runStatus.Succeeded,
    }),
  } as unknown as GraphElement<ElementModel, PipelineRunNodeData>;
  const parent = {
    ...testPipelineRuns[DataState.SUCCEEDED],
    metadata: { name: 'build', namespace: 'team' },
  };
  renderWithQueryClientAndRouter(
    <TaskRunPanel taskNode={taskNode} pipelineRun={parent} onClose={() => {}} />,
  );
  expect(screen.getByRole('link', { name: 'compile' })).toHaveAttribute(
    'href',
    '/ns/team/pipelineruns/build/taskruns/compile-1',
  );
});
