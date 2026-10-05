import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import PipelineRunLogsTab from '~/components/PipelineRun/PipelineRunDetailsView/tabs/PipelineRunLogsTab';
import { mockUseNamespaceHook, renderWithQueryClientAndRouter } from '~/unit-test-utils';

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunV2: () => [
    {
      metadata: { name: 'build', namespace: 'team' },
      spec: {},
      status: {
        pipelineSpec: { tasks: [{ name: 'compile' }] },
        conditions: [{ type: 'Succeeded', status: 'False', reason: 'Failed' }],
      },
    },
    true,
    undefined,
  ],
}));
jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: () => [
    [
      {
        metadata: { name: 'compile-1', labels: { 'tekton.dev/pipelineTask': 'compile' } },
        spec: { taskRef: { name: 'compile' } },
        status: {
          conditions: [
            { type: 'Succeeded', status: 'False', reason: 'Failed', message: 'Compilation failed' },
          ],
        },
      },
    ],
    true,
    undefined,
  ],
}));
mockUseNamespaceHook('team');

it('records the initially selected task in the logs URL after mounting', () => {
  window.history.replaceState({}, '', '/ns/team/pipelineruns/build/logs');
  renderWithQueryClientAndRouter(
    <Routes>
      <Route
        path="/ns/:workspaceName/pipelineruns/:pipelineRunName/logs"
        element={<PipelineRunLogsTab />}
      />
    </Routes>,
  );
  expect(screen.getByText('Compilation failed')).toBeInTheDocument();
  expect(window.location.pathname + window.location.search).toBe(
    '/ns/team/pipelineruns/build/logs?task=compile',
  );
});
