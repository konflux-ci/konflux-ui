import { Route, Routes } from 'react-router-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataState, testPipelineRuns } from '~/__data__/pipelinerun-data';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import {
  createUseParamsMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
} from '~/unit-test-utils';
import { useAccessReviewForModel } from '~/utils/rbac';
import NamespacePipelineRunDetailsView from '../NamespacePipelineRunDetailsView';

jest.mock('~/hooks/usePipelineRunsV2', () => ({ usePipelineRunV2: jest.fn() }));
jest.mock('~/utils/rbac', () => ({ useAccessReviewForModel: jest.fn() }));
jest.mock('~/hooks/useStatusOnFavicon', () => ({ useStatusOnFavicon: jest.fn() }));
jest.mock('~/components/PipelineRun/PipelineRunListView/pipelinerun-actions', () => ({
  usePipelinererunAction: () => ({ key: 'rerun', label: 'Rerun', isDisabled: true }),
}));

describe('NamespacePipelineRunDetailsView', () => {
  const run = {
    ...testPipelineRuns[DataState.SUCCEEDED],
    metadata: {
      name: 'build-1',
      namespace: 'team',
      labels: { [PipelineRunLabel.COMPONENT_GROUP]: 'group' },
    },
  };
  createUseParamsMock({ pipelineRunName: 'build-1' });
  mockUseNamespaceHook('team');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(usePipelineRunV2).mockReturnValue([run, true, undefined]);
    jest.mocked(useAccessReviewForModel).mockReturnValue([false, true]);
    window.history.replaceState({}, '', '/ns/team/pipelineruns/build-1');
  });

  it('renders group breadcrumbs and navigates to namespace logs', async () => {
    const user = userEvent.setup();
    renderWithQueryClientAndRouter(<NamespacePipelineRunDetailsView />);
    expect(screen.getByRole('link', { name: 'Groups' })).toHaveAttribute('href', '/ns/team/groups');
    expect(screen.getByRole('tab', { name: 'Task runs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pipeline runs' })).toHaveAttribute(
      'href',
      '/ns/team/groups/group/pipelineruns',
    );
    await user.click(screen.getByRole('tab', { name: 'Logs' }));
    expect(window.location.pathname).toBe('/ns/team/pipelineruns/build-1/logs');
  });

  it('does not render breadcrumb navigation without group or component labels', () => {
    jest
      .mocked(usePipelineRunV2)
      .mockReturnValue([{ ...run, metadata: { ...run.metadata, labels: {} } }, true, undefined]);
    renderWithQueryClientAndRouter(<NamespacePipelineRunDetailsView />);
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });

  it('redirects application runs, preserving the logs tab and task query', () => {
    window.history.replaceState({}, '', '/ns/team/pipelineruns/build-1/logs?task=compile');
    jest.mocked(usePipelineRunV2).mockReturnValue([
      {
        ...run,
        metadata: { ...run.metadata, labels: { [PipelineRunLabel.APPLICATION]: 'app' } },
      },
      true,
      undefined,
    ]);
    renderWithQueryClientAndRouter(
      <Routes>
        <Route
          path="/ns/:namespace/pipelineruns/:pipelineRunName/*"
          element={<NamespacePipelineRunDetailsView />}
        />
        <Route
          path="/ns/:namespace/applications/:application/pipelineruns/:pipelineRunName/*"
          element={<div>Application details</div>}
        />
      </Routes>,
    );
    expect(window.location.pathname + window.location.search).toBe(
      '/ns/team/applications/app/pipelineruns/build-1/logs?task=compile',
    );
  });

  it('shows loading and missing-run states', () => {
    jest.mocked(usePipelineRunV2).mockReturnValue([undefined, false, undefined]);
    const view = renderWithQueryClientAndRouter(<NamespacePipelineRunDetailsView />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    jest.mocked(usePipelineRunV2).mockReturnValue([undefined, true, undefined]);
    view.rerender(<NamespacePipelineRunDetailsView />);
    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
  });

  it('shows fetch errors', () => {
    jest.mocked(usePipelineRunV2).mockReturnValue([undefined, true, { code: 403 }]);
    renderWithQueryClientAndRouter(<NamespacePipelineRunDetailsView />);
    expect(screen.getByText('Unable to load pipeline run')).toBeInTheDocument();
  });

  it('disables stop and cancel when patch access is denied', async () => {
    const user = userEvent.setup();
    renderWithQueryClientAndRouter(<NamespacePipelineRunDetailsView />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menuitem', { name: 'Stop' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('menuitem', { name: 'Cancel' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
