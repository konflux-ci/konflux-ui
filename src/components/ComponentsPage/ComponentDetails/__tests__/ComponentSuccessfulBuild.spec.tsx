import { screen, within } from '@testing-library/react';
import ComponentSuccessfulBuild from '~/components/ComponentsPage/ComponentDetails/ComponentSuccessfulBuild';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useImageProxy } from '~/hooks/useImageProxy';
import { useImageRepository } from '~/hooks/useImageRepository';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { useIsImageControllerEnabled } from '~/image-controller/conditional-checks';
import { ComponentKind, ImageRepositoryKind, PipelineRunKind, TaskRunKind } from '~/types';
import { mockUseNamespaceHook, renderWithQueryClientAndRouter } from '~/unit-test-utils';

jest.mock('~/hooks/useTaskRunsV2', () => ({ useTaskRunsForPipelineRuns: jest.fn() }));
jest.mock('~/hooks/useImageProxy', () => ({ useImageProxy: jest.fn() }));
jest.mock('~/hooks/useImageRepository', () => ({ useImageRepository: jest.fn() }));
jest.mock('~/image-controller/conditional-checks', () => ({
  useIsImageControllerEnabled: jest.fn(),
}));

const component = {
  metadata: { name: 'frontend', namespace: 'test-ns' },
  spec: { containerImage: 'quay.io/unbuilt/repository' },
  status: { lastPromotedImage: 'quay.io/wrong/legacy:old' },
} as ComponentKind;
const run = {
  apiVersion: 'tekton.dev/v1',
  kind: 'PipelineRun',
  spec: {},
  metadata: {
    name: 'stable-build',
    namespace: 'test-ns',
    labels: {
      [PipelineRunLabel.COMPONENT_VERSION]: 'stable',
      [PipelineRunLabel.COMMIT_LABEL]: 'abcdef123456',
      [PipelineRunLabel.COMPONENT]: 'frontend',
    },
    annotations: {
      [PipelineRunLabel.COMMIT_URL_ANNOTATION]: 'https://github.com/org/repo/commit/abcdef123456',
      [PipelineRunLabel.COMMIT_SHA_TITLE_ANNOTATION]: 'Fix stable release',
    },
  },
  status: {
    pipelineSpec: { tasks: [] },
    completionTime: '2026-10-01T12:00:00Z',
    results: [
      { name: 'IMAGE_URL', value: 'quay.io/redhat-user-workloads/org/frontend:stable' },
      { name: 'IMAGE_DIGEST', value: 'sha256:123' },
    ],
  },
} as PipelineRunKind;
const image = 'quay.io/redhat-user-workloads/org/frontend@sha256:123';

describe('Component successful build', () => {
  mockUseNamespaceHook('test-ns');
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(useTaskRunsForPipelineRuns)
      .mockReturnValue([
        [],
        true,
        undefined,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);
    jest.mocked(useImageProxy).mockReturnValue([null, true, undefined]);
    jest.mocked(useImageRepository).mockReturnValue([undefined, true, undefined]);
    jest
      .mocked(useIsImageControllerEnabled)
      .mockReturnValue({ isImageControllerEnabled: false } as ReturnType<
        typeof useIsImageControllerEnabled
      >);
  });

  it('groups build metadata separately from artifacts in legacy reading order', () => {
    renderWithQueryClientAndRouter(
      <ComponentSuccessfulBuild component={component} pipelineRun={run} loaded />,
    );
    const metadata = screen.getByText('Build pipeline run').closest('dl');
    const artifacts = screen.getByText('SBOM').closest('dl');
    expect(metadata).not.toBe(artifacts);
    expect(
      within(metadata)
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual(['Build pipeline run', 'Triggered by', 'Version']);
    expect(
      within(artifacts)
        .getAllByRole('term')
        .map((term) => term.textContent),
    ).toEqual(['SBOM', 'Latest image', 'Fixable vulnerabilities scan']);
  });

  it('uses the selected successful run for image, SBOM, logs, commit, version and TaskRuns', () => {
    renderWithQueryClientAndRouter(
      <ComponentSuccessfulBuild component={component} pipelineRun={run} loaded />,
    );
    expect(screen.getByDisplayValue(`cosign download sbom ${image}`)).toBeInTheDocument();
    expect(screen.getByDisplayValue(image)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View build logs' })).toHaveAttribute(
      'href',
      '/ns/test-ns/pipelineruns/stable-build/logs',
    );
    expect(screen.getByRole('link', { name: 'stable-build' })).toHaveAttribute(
      'href',
      '/ns/test-ns/pipelineruns/stable-build',
    );
    expect(screen.getByRole('link', { name: 'abcdef1' })).toHaveAttribute(
      'href',
      'https://github.com/org/repo/commit/abcdef123456',
    );
    expect(screen.getByText('Fix stable release')).toBeInTheDocument();
    expect(screen.getByText('stable')).toBeInTheDocument();
    expect(useTaskRunsForPipelineRuns).toHaveBeenCalledWith(
      'test-ns',
      'stable-build',
      undefined,
      false,
    );
  });

  it('supports Tekton v1beta1 results', () => {
    const legacyRun = {
      ...run,
      apiVersion: 'tekton.dev/v1beta1',
      status: { pipelineResults: run.status.results },
    } as PipelineRunKind;
    renderWithQueryClientAndRouter(
      <ComponentSuccessfulBuild component={component} pipelineRun={legacyRun} loaded />,
    );
    expect(screen.getByDisplayValue(`cosign download sbom ${image}`)).toBeInTheDocument();
  });

  it('never uses the repository or legacy promoted image when build results are missing', () => {
    renderWithQueryClientAndRouter(
      <ComponentSuccessfulBuild
        component={component}
        pipelineRun={{ ...run, status: undefined }}
        loaded
      />,
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText(component.spec.containerImage)).not.toBeInTheDocument();
    expect(screen.queryByText(component.status.lastPromotedImage)).not.toBeInTheDocument();
  });

  it('shows loading without mounting TaskRun queries or empty state', () => {
    renderWithQueryClientAndRouter(
      <ComponentSuccessfulBuild component={component} loaded={false} />,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('No successful build pipeline available')).not.toBeInTheDocument();
    expect(useTaskRunsForPipelineRuns).not.toHaveBeenCalled();
  });

  it('shows an empty state without mounting TaskRun queries', () => {
    renderWithQueryClientAndRouter(<ComponentSuccessfulBuild component={component} loaded />);
    expect(screen.getByText('No successful build pipeline available')).toBeInTheDocument();
    expect(useTaskRunsForPipelineRuns).not.toHaveBeenCalled();
  });

  it('shows a pipeline error', () => {
    renderWithQueryClientAndRouter(
      <ComponentSuccessfulBuild component={component} loaded error={{ code: 403 }} />,
    );
    expect(screen.getByText('Unable to load pipeline run')).toBeInTheDocument();
  });

  it('keeps build details visible when TaskRuns fail', () => {
    jest
      .mocked(useTaskRunsForPipelineRuns)
      .mockReturnValue([
        [],
        true,
        { code: 500 },
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);
    renderWithQueryClientAndRouter(
      <ComponentSuccessfulBuild component={component} pipelineRun={run} loaded />,
    );
    expect(screen.getByText('Unable to load task runs')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View build logs' })).toBeInTheDocument();
  });

  it('shows scan results and logs for the selected run', () => {
    const taskRun = {
      apiVersion: 'tekton.dev/v1',
      kind: 'TaskRun',
      spec: {},
      metadata: { name: 'stable-scan', labels: { 'tekton.dev/pipelineRun': 'stable-build' } },
      status: {
        results: [
          {
            name: 'CLAIR_SCAN_RESULT',
            value: JSON.stringify({ vulnerabilities: { critical: 2, high: 0, medium: 0, low: 0 } }),
          },
        ],
      },
    } as TaskRunKind;
    jest
      .mocked(useTaskRunsForPipelineRuns)
      .mockReturnValue([
        [taskRun],
        true,
        undefined,
        undefined,
        { hasNextPage: false, isFetchingNextPage: false },
      ]);
    renderWithQueryClientAndRouter(
      <ComponentSuccessfulBuild component={component} pipelineRun={run} loaded />,
    );
    expect(screen.getByRole('link', { name: 'View logs' })).toHaveAttribute(
      'href',
      '/ns/test-ns/pipelineruns/stable-build/taskruns/stable-scan/logs',
    );
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('uses private image proxy and falls back to the original image when proxy fails', () => {
    jest
      .mocked(useIsImageControllerEnabled)
      .mockReturnValue({ isImageControllerEnabled: true } as ReturnType<
        typeof useIsImageControllerEnabled
      >);
    jest
      .mocked(useImageRepository)
      .mockReturnValue([
        { spec: { image: { visibility: 'private' } } } as ImageRepositoryKind,
        true,
        undefined,
      ]);
    jest
      .mocked(useImageProxy)
      .mockReturnValue([
        { hostname: 'proxy.example.com' } as ReturnType<typeof useImageProxy>[0],
        true,
        undefined,
      ]);
    const { rerender } = renderWithQueryClientAndRouter(
      <ComponentSuccessfulBuild component={component} pipelineRun={run} loaded />,
    );
    expect(
      screen.getByDisplayValue(
        'cosign download sbom proxy.example.com/redhat-user-workloads/org/frontend@sha256:123',
      ),
    ).toBeInTheDocument();
    jest.mocked(useImageProxy).mockReturnValue([null, true, new Error('Proxy unavailable')]);
    rerender(<ComponentSuccessfulBuild component={component} pipelineRun={run} loaded />);
    expect(screen.getByDisplayValue(`cosign download sbom ${image}`)).toBeInTheDocument();
  });
});
