import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskRunSecurityTab } from '~/components/TaskRunDetailsView/tabs/TaskRunSecurityTab';
import { useTaskRunV2 } from '~/hooks/useTaskRunsV2';
import { CONFORMA_RESULT_STATUS, ConformaResultRow } from '~/types/conforma';
import { mockUseNamespaceHook, renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { WrappedConformaRow } from '../ConformaTable/ConformaRow';
import SecurityTabEmptyState from '../SecurityTabEmptyState';
import { useConformaResult } from '../useConformaResult';

jest.mock('~/hooks/useTaskRunsV2', () => ({ useTaskRunV2: jest.fn() }));
jest.mock('../useConformaResult', () => ({ useConformaResult: jest.fn() }));
mockUseNamespaceHook('team');
const rule: ConformaResultRow = {
  title: 'Rule',
  component: 'api',
  status: CONFORMA_RESULT_STATUS.successes,
  description: '',
  msg: '',
  timestamp: '',
  collection: [],
  images: [],
};

it.each([
  ['/ns/team/pipelineruns/build/security', '/ns/team/pipelineruns/build'],
  ['/ns/team/pipelineruns/build/taskruns/verify/security', '/ns/team/pipelineruns/build'],
  [
    '/ns/team/applications/app/pipelineruns/build/security',
    '/ns/team/applications/app/pipelineruns/build',
  ],
])('returns from %s to the parent details', async (url, destination) => {
  const user = userEvent.setup();
  window.history.replaceState({}, '', url);
  renderWithQueryClientAndRouter(
    <Routes>
      <Route
        path="/ns/:workspaceName/pipelineruns/:pipelineRunName/*"
        element={<SecurityTabEmptyState />}
      />
      <Route
        path="/ns/:workspaceName/applications/:applicationName/pipelineruns/:pipelineRunName/*"
        element={<SecurityTabEmptyState />}
      />
    </Routes>,
  );
  await user.click(screen.getByRole('button', { name: 'Return to pipeline run details' }));
  expect(window.location.pathname).toBe(destination);
});

it.each([
  ['/ns/team/pipelineruns/build/security', '/ns/team/components/api'],
  [
    '/ns/team/applications/app/pipelineruns/build/security',
    '/ns/team/applications/app/components/api',
  ],
])('links components from %s to the corresponding component route', (url, destination) => {
  window.history.replaceState({}, '', url);
  const row = (
    <table>
      <tbody>
        <tr>
          <WrappedConformaRow obj={rule} customData={{ sortedConformaResult: [rule] }} />
        </tr>
      </tbody>
    </table>
  );
  renderWithQueryClientAndRouter(
    <Routes>
      <Route path="/ns/:workspaceName/pipelineruns/:pipelineRunName/*" element={row} />
      <Route
        path="/ns/:workspaceName/applications/:applicationName/pipelineruns/:pipelineRunName/*"
        element={row}
      />
    </Routes>,
  );
  expect(screen.getByRole('link', { name: 'api' })).toHaveAttribute('href', destination);
});

it('loads security results for an owner-reference-only task and returns to its parent', async () => {
  const user = userEvent.setup();
  jest.mocked(useTaskRunV2).mockReturnValue([
    {
      apiVersion: 'tekton.dev/v1',
      kind: 'TaskRun',
      metadata: {
        name: 'verify',
        ownerReferences: [
          { apiVersion: 'tekton.dev/v1', kind: 'PipelineRun', name: 'build', uid: 'parent' },
        ],
      },
      spec: {},
    },
    true,
    undefined,
  ]);
  jest.mocked(useConformaResult).mockReturnValue([undefined, true, undefined]);
  window.history.replaceState({}, '', '/ns/team/pipelineruns/build/taskruns/verify/security');
  renderWithQueryClientAndRouter(
    <Routes>
      <Route
        path="/ns/:workspaceName/pipelineruns/:pipelineRunName/taskruns/:taskRunName/security"
        element={<TaskRunSecurityTab />}
      />
    </Routes>,
  );
  expect(useConformaResult).toHaveBeenCalledWith(
    'build',
    expect.objectContaining({ metadata: expect.objectContaining({ name: 'verify' }) }),
  );
  await user.click(screen.getByRole('button', { name: 'Return to pipeline run details' }));
  expect(window.location.pathname).toBe('/ns/team/pipelineruns/build');
});
