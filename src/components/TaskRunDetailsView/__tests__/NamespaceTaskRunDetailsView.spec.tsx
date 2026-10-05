import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataState, testPipelineRuns } from '~/__data__/pipelinerun-data';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useTaskRunV2 } from '~/hooks/useTaskRunsV2';
import { TaskRunKind, TektonResourceLabel } from '~/types';
import {
  createUseParamsMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
} from '~/unit-test-utils';
import NamespaceTaskRunDetailsView from '../NamespaceTaskRunDetailsView';

jest.mock('~/hooks/usePipelineRunsV2', () => ({ usePipelineRunV2: jest.fn() }));
jest.mock('~/hooks/useTaskRunsV2', () => ({ useTaskRunV2: jest.fn() }));
jest.mock('~/hooks/useStatusOnFavicon', () => ({ useStatusOnFavicon: jest.fn() }));
createUseParamsMock({ pipelineRunName: 'build', taskRunName: 'compile' });
mockUseNamespaceHook('team');
const parent = {
  ...testPipelineRuns[DataState.SUCCEEDED],
  metadata: {
    name: 'build',
    namespace: 'team',
    labels: { [PipelineRunLabel.COMPONENT_GROUP]: 'checkout' },
  },
};
const task: TaskRunKind = {
  apiVersion: 'tekton.dev/v1',
  kind: 'TaskRun',
  metadata: {
    name: 'compile',
    namespace: 'team',
    labels: { [TektonResourceLabel.pipelinerun]: 'build' },
  },
  spec: {},
  status: { conditions: [{ type: 'Succeeded', status: 'True' }] },
};

beforeEach(() => {
  jest.clearAllMocks();
  window.history.replaceState({}, '', '/ns/team/pipelineruns/build/taskruns/compile');
  jest.mocked(usePipelineRunV2).mockReturnValue([parent, true, undefined]);
  jest.mocked(useTaskRunV2).mockReturnValue([task, true, undefined]);
});

it('extends the parent breadcrumbs and navigates to nested logs', async () => {
  const user = userEvent.setup();
  renderWithQueryClientAndRouter(<NamespaceTaskRunDetailsView />);
  expect(screen.getByRole('link', { name: 'Groups' })).toHaveAttribute('href', '/ns/team/groups');
  expect(screen.getByRole('link', { name: 'build' })).toHaveAttribute(
    'href',
    '/ns/team/pipelineruns/build',
  );
  expect(screen.getByRole('link', { name: 'Task runs' })).toHaveAttribute(
    'href',
    '/ns/team/pipelineruns/build/taskruns',
  );
  await user.click(screen.getByRole('tab', { name: 'Logs' }));
  expect(window.location.pathname).toBe('/ns/team/pipelineruns/build/taskruns/compile/logs');
});

it('omits breadcrumbs when the parent has no group or component labels', () => {
  jest
    .mocked(usePipelineRunV2)
    .mockReturnValue([
      { ...parent, metadata: { ...parent.metadata, labels: undefined } },
      true,
      undefined,
    ]);
  renderWithQueryClientAndRouter(<NamespaceTaskRunDetailsView />);
  expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
});

it('rejects a task belonging to a different pipeline run', () => {
  jest.mocked(useTaskRunV2).mockReturnValue([
    {
      ...task,
      metadata: {
        ...task.metadata,
        labels: { [TektonResourceLabel.pipelinerun]: 'different-run' },
      },
    },
    true,
    undefined,
  ]);
  renderWithQueryClientAndRouter(<NamespaceTaskRunDetailsView />);
  expect(screen.getByText('404: Page not found')).toBeInTheDocument();
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
});

it('keeps an archived task readable when its parent no longer exists', () => {
  jest.mocked(usePipelineRunV2).mockReturnValue([undefined, true, { code: 404 }]);
  renderWithQueryClientAndRouter(<NamespaceTaskRunDetailsView />);
  expect(screen.getByRole('tab', { name: 'Details' })).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
});

it('redirects using the parent application while preserving the task tab and query', () => {
  jest.mocked(usePipelineRunV2).mockReturnValue([
    {
      ...parent,
      metadata: { ...parent.metadata, labels: { [PipelineRunLabel.APPLICATION]: 'app' } },
    },
    true,
    undefined,
  ]);
  window.history.replaceState(
    {},
    '',
    '/ns/team/pipelineruns/build/taskruns/compile/logs?step=build',
  );
  renderWithQueryClientAndRouter(
    <Routes>
      <Route
        path="/ns/:workspaceName/pipelineruns/:pipelineRunName/taskruns/:taskRunName/*"
        element={<NamespaceTaskRunDetailsView />}
      />
      <Route
        path="/ns/:workspaceName/applications/:applicationName/taskruns/:taskRunName/*"
        element={<p>Application task</p>}
      />
    </Routes>,
  );
  expect(window.location.pathname + window.location.search).toBe(
    '/ns/team/applications/app/taskruns/compile/logs?step=build',
  );
});

it('shows loading and task fetch errors', () => {
  jest.mocked(useTaskRunV2).mockReturnValue([undefined, false, undefined]);
  const view = renderWithQueryClientAndRouter(<NamespaceTaskRunDetailsView />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
  jest.mocked(useTaskRunV2).mockReturnValue([undefined, true, { code: 403 }]);
  view.rerender(<NamespaceTaskRunDetailsView />);
  expect(screen.getByText('Unable to load task run')).toBeInTheDocument();
});
