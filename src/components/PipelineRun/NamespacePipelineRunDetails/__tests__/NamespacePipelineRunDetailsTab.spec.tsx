import { screen, within } from '@testing-library/react';
import { mockPrivateImageRepository } from '~/__data__/image-repository-data';
import { DataState, testPipelineRuns } from '~/__data__/pipelinerun-data';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useImageProxy } from '~/hooks/useImageProxy';
import { useImageRepository } from '~/hooks/useImageRepository';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { useIsImageControllerEnabled } from '~/image-controller/conditional-checks';
import {
  createUseParamsMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
} from '~/unit-test-utils';
import NamespacePipelineRunDetailsTab from '../NamespacePipelineRunDetailsTab';

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunV2: jest.fn(),
}));
jest.mock('~/hooks/useTaskRunsV2', () => ({ useTaskRunsForPipelineRuns: jest.fn() }));
jest.mock('~/hooks/useUIInstance', () => ({ useSbomUrl: () => () => undefined }));
jest.mock('~/hooks/useImageProxy', () => ({ useImageProxy: jest.fn() }));
jest.mock('~/hooks/useImageRepository', () => ({ useImageRepository: jest.fn() }));
jest.mock('~/image-controller/conditional-checks', () => ({
  useIsImageControllerEnabled: jest.fn(),
}));
// Topology needs SVG layout APIs that jsdom does not implement; navigation is covered separately.
jest.mock(
  '~/components/PipelineRun/PipelineRunDetailsView/visualization/PipelineRunVisualization',
  () => () => null,
);

describe('NamespacePipelineRunDetailsTab', () => {
  const run = {
    ...testPipelineRuns[DataState.SUCCEEDED],
    metadata: {
      name: 'build-1',
      namespace: 'team',
      labels: {
        [PipelineRunLabel.COMPONENT_GROUP]: 'group',
        [PipelineRunLabel.COMPONENT]: 'api',
        [PipelineRunLabel.SNAPSHOT]: 'snapshot',
        [PipelineRunLabel.TEST_SERVICE_SCENARIO]: 'smoke',
        [PipelineRunLabel.COMMIT_LABEL]: 'abcdef123456',
      },
    },
  };
  createUseParamsMock({ pipelineRunName: 'build-1' });
  mockUseNamespaceHook('team');

  beforeEach(() => {
    jest.clearAllMocks();
    (useIsImageControllerEnabled as jest.Mock).mockReturnValue({ isImageControllerEnabled: false });
    jest.mocked(useImageProxy).mockReturnValue([undefined, true, undefined]);
    jest.mocked(useImageRepository).mockReturnValue([undefined, true, undefined]);
    jest.mocked(usePipelineRunV2).mockReturnValue([run, true, undefined]);
    jest
      .mocked(useTaskRunsForPipelineRuns)
      .mockReturnValue([
        [],
        true,
        undefined,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);
  });

  it('uses the access proxy for private image SBOM downloads', () => {
    (useIsImageControllerEnabled as jest.Mock).mockReturnValue({ isImageControllerEnabled: true });
    jest.mocked(useImageRepository).mockReturnValue([mockPrivateImageRepository, true, undefined]);
    jest.mocked(useImageProxy).mockReturnValue([
      {
        hostname: 'image-proxy.example',
        fullUrl: 'https://image-proxy.example',
        oauthPath: '/oauth',
        buildUrl: (path) => `https://image-proxy.example${path}`,
      },
      true,
      undefined,
    ]);
    jest.mocked(usePipelineRunV2).mockReturnValue([
      {
        ...run,
        metadata: {
          ...run.metadata,
          annotations: {
            [PipelineRunLabel.BUILD_IMAGE_ANNOTATION]:
              'quay.io/redhat-user-workloads/team/api:latest',
          },
        },
      },
      true,
      undefined,
    ]);
    renderWithQueryClientAndRouter(<NamespacePipelineRunDetailsTab />);
    expect(
      screen.getByDisplayValue(
        'cosign download sbom image-proxy.example/redhat-user-workloads/team/api:latest',
      ),
    ).toBeInTheDocument();
  });

  it('preserves the pipeline failure message alongside a different task failure', () => {
    jest.mocked(usePipelineRunV2).mockReturnValue([
      {
        ...run,
        status: {
          ...run.status,
          conditions: [
            { type: 'Succeeded', status: 'False', reason: 'Failed', message: 'Two tasks failed' },
          ],
        },
      },
      true,
      undefined,
    ]);
    jest.mocked(useTaskRunsForPipelineRuns).mockReturnValue([
      [
        {
          apiVersion: 'tekton.dev/v1',
          kind: 'TaskRun',
          metadata: { name: 'compile' },
          spec: { taskRef: { name: 'compile' } },
          status: {
            conditions: [
              {
                type: 'Succeeded',
                status: 'False',
                reason: 'Failed',
                message: 'Compilation failed',
              },
            ],
          },
        },
      ],
      true,
      undefined,
      undefined,
      { hasNextPage: false, isFetchingNextPage: false },
    ]);
    renderWithQueryClientAndRouter(<NamespacePipelineRunDetailsTab />);
    expect(screen.getByText('Two tasks failed')).toBeInTheDocument();
    expect(screen.getByText('Compilation failed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See logs' })).toHaveAttribute(
      'href',
      '/ns/team/pipelineruns/build-1/logs',
    );
  });

  it('links group, component, snapshot and test without an application', () => {
    renderWithQueryClientAndRouter(<NamespacePipelineRunDetailsTab />);
    for (const [name, href] of [
      ['group', '/ns/team/groups/group'],
      ['api', '/ns/team/components/api'],
      ['snapshot', '/ns/team/groups/group/snapshots/snapshot'],
      ['smoke', '/ns/team/groups/group/integrationtests/smoke'],
    ])
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
    expect(screen.queryByText('Application')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'abcdef1' })).not.toBeInTheDocument();
  });

  it('renders snapshot and test as text when no group destination exists', () => {
    const labels = { ...run.metadata.labels };
    delete labels[PipelineRunLabel.COMPONENT_GROUP];
    jest
      .mocked(usePipelineRunV2)
      .mockReturnValue([{ ...run, metadata: { ...run.metadata, labels } }, true, undefined]);
    renderWithQueryClientAndRouter(<NamespacePipelineRunDetailsTab />);
    expect(screen.getByText('snapshot')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'snapshot' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'smoke' })).not.toBeInTheDocument();
  });

  it('shows loading, error and missing-run states', () => {
    jest.mocked(usePipelineRunV2).mockReturnValue([undefined, false, undefined]);
    const view = renderWithQueryClientAndRouter(<NamespacePipelineRunDetailsTab />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    jest.mocked(usePipelineRunV2).mockReturnValue([undefined, true, { code: 404 }]);
    view.rerender(<NamespacePipelineRunDetailsTab />);
    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
    jest.mocked(usePipelineRunV2).mockReturnValue([undefined, true, undefined]);
    view.rerender(<NamespacePipelineRunDetailsTab />);
    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
  });

  it('keeps run metadata visible when task runs cannot be loaded', () => {
    jest
      .mocked(useTaskRunsForPipelineRuns)
      .mockReturnValue([
        [],
        true,
        { code: 403 },
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);
    renderWithQueryClientAndRouter(<NamespacePipelineRunDetailsTab />);
    expect(screen.getByText('build-1')).toBeInTheDocument();
    expect(screen.getByText('Unable to load task runs')).toBeInTheDocument();
  });

  it('matches the existing details field order within each column', () => {
    renderWithQueryClientAndRouter(<NamespacePipelineRunDetailsTab />);
    expect(
      within(
        screen
          .getAllByRole('term')
          .find((term) => term.textContent === 'Name')
          .closest('dl'),
      )
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual(['Name', 'Namespace', 'Labels', 'Annotations', 'Created at', 'Duration']);
    expect(
      within(
        screen
          .getAllByRole('term')
          .find((term) => term.textContent === 'Status')
          .closest('dl'),
      )
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual([
      'Status',
      'Pipeline',
      'Snapshot',
      'Component group',
      'Component',
      'Commit',
      'Integration test',
    ]);
    expect(screen.queryByText('Started')).not.toBeInTheDocument();
  });
});
