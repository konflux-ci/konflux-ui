import { screen } from '@testing-library/react';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useImageProxy } from '~/hooks/useImageProxy';
import { useImageRepository } from '~/hooks/useImageRepository';
import { useLatestSuccessfulBuildPipelineRunForComponentAndBranchV2 } from '~/hooks/useLatestPushBuildPipeline';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import ComponentVersionLatestBuild from '../tabs/ComponentVersionLatestBuild';

jest.mock('~/hooks/useLatestPushBuildPipeline', () => ({
  useLatestSuccessfulBuildPipelineRunForComponentAndBranchV2: jest.fn(),
}));
jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(),
}));
jest.mock('~/hooks/useImageProxy', () => ({
  useImageProxy: jest.fn(),
}));
jest.mock('~/hooks/useImageRepository', () => ({
  useImageRepository: jest.fn(),
}));
jest.mock('~/components/LogViewer/BuildLogViewer', () => ({
  useBuildLogViewerModal: () => jest.fn(),
}));

const mockUseLatestBuild = useLatestSuccessfulBuildPipelineRunForComponentAndBranchV2 as jest.Mock;
const mockUseTaskRuns = useTaskRunsForPipelineRuns as jest.Mock;
const mockUseImageProxy = useImageProxy as jest.Mock;
const mockUseImageRepository = useImageRepository as jest.Mock;

const mockComponent = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Component',
  metadata: { name: 'my-component', namespace: 'test-ns' },
  spec: { componentName: 'my-component', application: 'my-app' },
};

const mockPipelineRun = {
  metadata: {
    name: 'build-1',
    namespace: 'test-ns',
    creationTimestamp: '2025-01-01T00:00:00Z',
    annotations: {
      [PipelineRunLabel.COMMIT_BRANCH_ANNOTATION]: 'main',
    },
  },
  status: {
    completionTime: '2025-01-01T01:00:00Z',
    taskRuns: {},
  },
  spec: { params: [] },
};

describe('ComponentVersionLatestBuild', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    mockUseLatestBuild.mockReturnValue([mockPipelineRun, true, undefined]);
    mockUseTaskRuns.mockReturnValue([[], true, undefined]);
    mockUseImageProxy.mockReturnValue([{ hostname: 'proxy.example.com' }, true, undefined]);
    mockUseImageRepository.mockReturnValue([
      { spec: { image: { visibility: 'public' } } },
      true,
      undefined,
    ]);
  });

  it('should show error state when pipeline run fails to load', () => {
    mockUseLatestBuild.mockReturnValue([undefined, true, new Error('Failed')]);
    renderWithQueryClientAndRouter(
      <ComponentVersionLatestBuild component={mockComponent} branchName="main" />,
    );
    expect(screen.getByText('Unable to load pipeline run')).toBeInTheDocument();
  });

  it('should show spinner while pipeline run or task runs are loading', () => {
    mockUseLatestBuild.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClientAndRouter(
      <ComponentVersionLatestBuild component={mockComponent} branchName="main" />,
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should show alert when no successful build pipeline exists', () => {
    mockUseLatestBuild.mockReturnValue([undefined, true, undefined]);
    renderWithQueryClientAndRouter(
      <ComponentVersionLatestBuild component={mockComponent} branchName="main" />,
    );
    expect(
      screen.getByText('No successful build pipeline available for this branch'),
    ).toBeInTheDocument();
  });

  it('should render build info when pipeline run is loaded', () => {
    renderWithQueryClientAndRouter(
      <ComponentVersionLatestBuild component={mockComponent} branchName="main" />,
    );
    expect(screen.getByText('Build pipeline run')).toBeInTheDocument();
    expect(screen.getByText('Completed at')).toBeInTheDocument();
    expect(screen.getByText('View build logs')).toBeInTheDocument();
    expect(screen.getByText('Triggered by')).toBeInTheDocument();
    expect(screen.getByText('SBOM')).toBeInTheDocument();
    expect(screen.getByText('Build container image')).toBeInTheDocument();
    expect(
      screen.getByTestId(`view-build-logs-${mockComponent.metadata.name}-main`),
    ).toBeInTheDocument();
  });
});
