import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useTaskRunV2 } from '~/hooks/useTaskRunsV2';
import { mockUseNamespaceHook, renderWithQueryClientAndRouter } from '~/unit-test-utils';
import NamespaceTaskRunDetailsView from '../NamespaceTaskRunDetailsView';
import TaskRunDetailsTab from '../tabs/TaskRunDetailsTab';
import { TaskRunDetailsView } from '../TaskRunDetailsView';

jest.mock('~/hooks/usePipelineRunsV2', () => ({ usePipelineRunV2: jest.fn() }));
jest.mock('~/hooks/useTaskRunsV2', () => ({ useTaskRunV2: jest.fn() }));
jest.mock('~/hooks/useStatusOnFavicon', () => ({ useStatusOnFavicon: jest.fn() }));

describe('ApplicationTaskRunDestination', () => {
  mockUseNamespaceHook('team');

  it('keeps the legacy destination usable when only the parent has an application label', () => {
    jest.mocked(usePipelineRunV2).mockReturnValue([
      {
        apiVersion: 'tekton.dev/v1',
        kind: 'PipelineRun',
        metadata: {
          name: 'build',
          namespace: 'team',
          labels: { [PipelineRunLabel.APPLICATION]: 'app' },
        },
        spec: {},
      },
      true,
      undefined,
    ]);
    jest.mocked(useTaskRunV2).mockReturnValue([
      {
        apiVersion: 'tekton.dev/v1',
        kind: 'TaskRun',
        metadata: {
          name: 'compile',
          namespace: 'team',
          labels: { 'tekton.dev/pipelineRun': 'build' },
        },
        spec: { taskRef: { name: 'compile' } },
        status: { conditions: [{ type: 'Succeeded', status: 'True' }] },
      },
      true,
      undefined,
    ]);
    window.history.replaceState({}, '', '/ns/team/pipelineruns/build/taskruns/compile');
    renderWithQueryClientAndRouter(
      <Routes>
        <Route
          path="/ns/:workspaceName/pipelineruns/:pipelineRunName/taskruns/:taskRunName"
          element={<NamespaceTaskRunDetailsView />}
        />
        <Route
          path="/ns/:workspaceName/applications/:applicationName/taskruns/:taskRunName"
          element={<TaskRunDetailsView />}
        >
          <Route index element={<TaskRunDetailsTab />} />
        </Route>
      </Routes>,
    );
    expect(window.location.pathname).toBe('/ns/team/applications/app/taskruns/compile');
    expect(
      screen
        .getAllByRole('link', { name: 'app' })
        .every((link) => link.getAttribute('href') === '/ns/team/applications/app'),
    ).toBe(true);
    expect(
      screen
        .getAllByRole('link', { name: 'build' })
        .every(
          (link) => link.getAttribute('href') === '/ns/team/applications/app/pipelineruns/build',
        ),
    ).toBe(true);
    expect(screen.getByRole('heading', { name: 'Task run details' })).toBeInTheDocument();
  });
});
