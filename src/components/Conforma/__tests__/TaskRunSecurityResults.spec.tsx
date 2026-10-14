import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { TaskRunSecurityTab } from '~/components/TaskRunDetailsView/tabs/TaskRunSecurityTab';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useTaskRunsForPipelineRuns, useTaskRunV2 } from '~/hooks/useTaskRunsV2';
import { mockUseNamespaceHook, renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { getTaskRunLog } from '~/utils/tekton-results';
import { mockConformaJSON } from '../__data__/mockConformaLogsJson';

jest.mock('~/hooks/usePipelineRunsV2', () => ({ usePipelineRunV2: jest.fn() }));
jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunV2: jest.fn(),
  useTaskRunsForPipelineRuns: jest.fn(),
}));
jest.mock('~/utils/tekton-results', () => ({
  ...jest.requireActual('~/utils/tekton-results'),
  getTaskRunLog: jest.fn(),
}));
jest.mock('~/feature-flags/hooks', () => ({
  ...jest.requireActual('~/feature-flags/hooks'),
  useIsOnFeatureFlag: () => false,
}));

describe('TaskRunSecurityResults', () => {
  mockUseNamespaceHook('team');

  it('reads the selected task logs even without labels or an available parent', async () => {
    jest.mocked(usePipelineRunV2).mockReturnValue([undefined, true, { code: 404 }]);
    jest
      .mocked(useTaskRunsForPipelineRuns)
      .mockReturnValue([
        [],
        true,
        undefined,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);
    jest.mocked(useTaskRunV2).mockReturnValue([
      {
        apiVersion: 'tekton.dev/v1',
        kind: 'TaskRun',
        metadata: {
          name: 'verify',
          namespace: 'team',
          uid: 'task-uid',
          ownerReferences: [
            { apiVersion: 'tekton.dev/v1', kind: 'PipelineRun', name: 'build', uid: 'parent-uid' },
          ],
        },
        spec: {},
      },
      true,
      undefined,
    ]);
    jest
      .mocked(getTaskRunLog)
      .mockResolvedValue(`step-report-json :-\n${JSON.stringify(mockConformaJSON)}\nstep-end :-`);
    window.history.replaceState({}, '', '/ns/team/pipelineruns/build/taskruns/verify/security');
    renderWithQueryClientAndRouter(
      <Routes>
        <Route
          path="/ns/:workspaceName/pipelineruns/:pipelineRunName/taskruns/:taskRunName/security"
          element={<TaskRunSecurityTab />}
        />
      </Routes>,
    );
    // The counts are rendered alongside their labels, so assert on the summary
    // text rather than on bare numbers.
    const summary = await screen.findByTestId('result-summary');
    expect(summary.textContent).toContain('1 violations');
    expect(summary.textContent).toContain('1 success');
    expect(getTaskRunLog).toHaveBeenCalledWith('team', 'task-uid', 'parent-uid');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
