import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupReleaseArtifactsTab from '~/components/Releases/GroupReleaseArtifactsTab';
import GroupReleaseDetailsView from '~/components/Releases/GroupReleaseDetailsView';
import GroupReleasePipelineRunsTab from '~/components/Releases/GroupReleasePipelineRunsTab';
import { ReleaseLabel } from '~/consts/release';
import { useRelease } from '~/hooks/useReleases';
import { ReleaseKind } from '~/types';
import {
  createUseParamsMock,
  createReactRouterMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
  setupVirtualizerMock,
} from '~/unit-test-utils';
import { downloadYaml } from '~/utils/common-utils';
import { useAccessReviewForModel } from '~/utils/rbac';
import { releaseRerun } from '~/utils/release-actions';

jest.mock('~/utils/common-utils', () => ({
  ...jest.requireActual('~/utils/common-utils'),
  downloadYaml: jest.fn(),
}));
jest.mock('~/utils/rbac', () => ({
  ...jest.requireActual('~/utils/rbac'),
  useAccessReviewForModel: jest.fn(),
}));
jest.mock('~/hooks/useReleases', () => ({ useRelease: jest.fn() }));
jest.mock('~/auth/useAuth', () => ({ useAuth: () => ({ user: { email: 'test@example.com' } }) }));
jest.mock('~/utils/release-actions', () => ({ releaseRerun: jest.fn() }));
jest.mock('@tanstack/react-virtual', () => ({ useVirtualizer: jest.fn() }));
createUseParamsMock({ groupName: 'my-group', releaseName: 'release-one' });
const navigate = jest.fn();
const useNavigateMock = createReactRouterMock('useNavigate');
mockUseNamespaceHook('test-ns');
const release: ReleaseKind = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Release',
  metadata: {
    name: 'release-one',
    namespace: 'test-ns',
    labels: { [ReleaseLabel.COMPONENT_GROUP]: 'my-group' },
  },
  spec: { releasePlan: 'plan-one', snapshot: 'snapshot-one' },
  status: {
    collectorsProcessing: { tenantCollectorsProcessing: { pipelineRun: 'test-ns/collector-run' } },
    tenantProcessing: {
      pipelineRun: 'test-ns/tenant-run',
      startTime: '2026-01-01T00:00:00Z',
      completionTime: '2026-01-01T00:00:10Z',
    },
    managedProcessing: { pipelineRun: 'managed-ns/managed-run' },
    finalProcessing: { pipelineRun: 'test-ns/final-run' },
    artifacts: {
      images: [
        {
          name: 'component-one',
          urls: ['quay.io/org/image:tag', 'quay.io/org/image:other'],
          arches: ['amd64', 'arm64'],
        },
      ],
      'github-release': { url: 'https://github.com/org/repo/releases/tag/v1' },
    },
  },
};
beforeEach(() => {
  jest.clearAllMocks();
  setupVirtualizerMock();
  useNavigateMock.mockReturnValue(navigate);
  jest.mocked(useAccessReviewForModel).mockReturnValue([true, true]);
  jest.mocked(releaseRerun).mockResolvedValue(release);
  jest.mocked(useRelease).mockReturnValue([release, true, undefined, undefined, false]);
  window.history.replaceState({}, '', '/ns/test-ns/groups/my-group/releases/release-one');
});
it('shows group breadcrumbs and all four release tabs', () => {
  renderWithQueryClientAndRouter(<GroupReleaseDetailsView />);
  expect(screen.getByRole('link', { name: 'Groups' })).toHaveAttribute(
    'href',
    '/ns/test-ns/groups',
  );
  expect(screen.getByRole('link', { name: 'Releases' })).toHaveAttribute(
    'href',
    '/ns/test-ns/groups/my-group/releases',
  );
  for (const name of ['Overview', 'Pipeline runs', 'Release artifacts', 'YAML'])
    expect(screen.getByRole('tab', { name })).toBeInTheDocument();
});
it('reruns the release and returns to group releases', async () => {
  const user = userEvent.setup();
  renderWithQueryClientAndRouter(<GroupReleaseDetailsView />);
  await user.click(screen.getByRole('button', { name: 'Actions' }));
  await user.click(screen.getByRole('menuitem', { name: 'Re-run release' }));
  await waitFor(() =>
    expect(navigate).toHaveBeenCalledWith('/ns/test-ns/groups/my-group/releases'),
  );
  expect(releaseRerun).toHaveBeenCalledWith(release, 'test@example.com');
});
it('disables rerun when permission is denied', async () => {
  jest.mocked(useAccessReviewForModel).mockReturnValue([false, true]);
  const user = userEvent.setup();
  renderWithQueryClientAndRouter(<GroupReleaseDetailsView />);
  await user.click(screen.getByRole('button', { name: 'Actions' }));
  expect(screen.getByRole('menuitem', { name: 'Re-run release' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
});
it.each([GroupReleaseDetailsView, GroupReleasePipelineRunsTab, GroupReleaseArtifactsTab])(
  'renders loading and missing resource states',
  (Component) => {
    jest.mocked(useRelease).mockReturnValue([undefined, false, undefined, undefined, false]);
    const view = renderWithQueryClientAndRouter(<Component />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    jest.mocked(useRelease).mockReturnValue([undefined, true, { code: 404 }, undefined, true]);
    view.rerender(<Component />);
    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
  },
);
it('rejects a release belonging to another group', () => {
  jest.mocked(useRelease).mockReturnValue([
    {
      ...release,
      metadata: {
        ...release.metadata,
        labels: { [ReleaseLabel.COMPONENT_GROUP]: 'another-group' },
      },
    },
    true,
    undefined,
    undefined,
    false,
  ]);
  renderWithQueryClientAndRouter(<GroupReleaseDetailsView />);
  expect(screen.getByText('404: Page not found')).toBeInTheDocument();
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
});
it('shows every processing stage and group snapshot links without requiring a release plan', () => {
  renderWithQueryClientAndRouter(<GroupReleasePipelineRunsTab />);
  for (const name of ['collector-run', 'tenant-run', 'managed-run', 'final-run'])
    expect(screen.getByText(name)).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'tenant-run' })).not.toBeInTheDocument();
  expect(screen.getByText('managed-ns')).toBeInTheDocument();
  expect(screen.getByText('10 seconds')).toBeInTheDocument();
  expect(screen.getAllByRole('link', { name: 'snapshot-one' })[0]).toHaveAttribute(
    'href',
    '/ns/test-ns/groups/my-group/snapshots/snapshot-one',
  );
});
it('shows an empty state for a release without processing runs', () => {
  jest
    .mocked(useRelease)
    .mockReturnValue([{ ...release, status: {} }, true, undefined, undefined, false]);
  renderWithQueryClientAndRouter(<GroupReleasePipelineRunsTab />);
  expect(screen.getByText('No pipeline runs')).toBeInTheDocument();
});
it('renders release URLs, artifact images, architectures and additional URLs', async () => {
  const user = userEvent.setup();
  renderWithQueryClientAndRouter(<GroupReleaseArtifactsTab />);
  expect(screen.getByText('component-one')).toBeInTheDocument();
  expect(screen.getByText('amd64, arm64')).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: 'https://github.com/org/repo/releases/tag/v1' }),
  ).toHaveAttribute('href', 'https://github.com/org/repo/releases/tag/v1');
  await user.click(screen.getByRole('button', { name: 'Details' }));
  expect(screen.getByRole('link', { name: 'quay.io/org/image:other' })).toHaveAttribute(
    'href',
    'https://quay.io/org/image:other',
  );
});
it('shows an empty state for a release without artifact images', () => {
  jest
    .mocked(useRelease)
    .mockReturnValue([{ ...release, status: {} }, true, undefined, undefined, false]);
  renderWithQueryClientAndRouter(<GroupReleaseArtifactsTab />);
  expect(screen.getByText('No release artifacts images')).toBeInTheDocument();
});

it('downloads the group release YAML', async () => {
  const user = userEvent.setup();
  renderWithQueryClientAndRouter(<GroupReleaseDetailsView />);
  await user.click(screen.getByRole('button', { name: 'Actions' }));
  await user.click(screen.getByRole('menuitem', { name: 'Download YAML' }));
  expect(downloadYaml).toHaveBeenCalledWith(release);
});
