import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import {
  mockPrivateImageRepository,
  mockPublicImageRepository,
} from '~/__data__/image-repository-data';
import { testPipelineRuns, DataState } from '~/__data__/pipelinerun-data';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { PipelineRunKind, TaskRunKind } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import {
  createPipelineRunMockStates,
  createTaskRunsMockStates,
  setupGetBBoxMock,
} from '~/unit-test-utils/mock-pipelinerun-test-utils';
import { createUseParamsMock } from '~/unit-test-utils/mock-react-router';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import PipelineRunDetailsTab from '../PipelineRunDetailsTab';

// Reuse existing mock data with customization
const mockPipelineRun = {
  ...testPipelineRuns[DataState.SUCCEEDED],
  metadata: {
    ...testPipelineRuns[DataState.SUCCEEDED].metadata,
    name: 'test-pipeline-run',
    namespace: 'test-namespace',
    creationTimestamp: '2024-01-01T00:00:00Z',
    labels: {
      ...testPipelineRuns[DataState.SUCCEEDED].metadata.labels,
      [PipelineRunLabel.APPLICATION]: 'test-app',
      [PipelineRunLabel.COMPONENT]: 'test-component',
      [PipelineRunLabel.PIPELINE_NAME]: 'test-pipeline',
    },
    annotations: {},
  },
  status: {
    ...testPipelineRuns[DataState.SUCCEEDED].status,
    startTime: '2024-01-01T00:00:00Z',
    completionTime: '2024-01-01T00:05:00Z',
  },
} as unknown as PipelineRunKind;

const baseFailedRun = testPipelineRuns[DataState.FAILED];
const failedPipelineRun = {
  ...baseFailedRun,
  status: {
    ...baseFailedRun.status,
    conditions: [
      {
        status: 'True',
        type: 'Failure',
        message: 'Pipeline execution failed with detailed error information',
      },
      {
        status: 'False',
        type: 'Succeeded',
        message: 'Error retrieving pipeline for pipelinerun',
        reason: 'CouldntGetPipeline',
      },
    ],
  },
} as PipelineRunKind;

const mockTaskRuns: TaskRunKind[] = [];

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunV2: jest.fn(),
  usePipelineRunsV2: jest.fn(() => [[], true, undefined, jest.fn(), {}]),
}));
jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(),
}));

// Mock useImageProxy hook
const mockUseImageProxy = jest.fn();
jest.mock('~/hooks/useImageProxy', () => ({
  useImageProxy: () => mockUseImageProxy(),
}));

// Mock useImageRepository hook
const mockUseImageRepository = jest.fn();
jest.mock('~/hooks/useImageRepository', () => ({
  useImageRepository: (namespace: string, name: string, watch: boolean) =>
    mockUseImageRepository(namespace, name, watch),
}));

const mockUsePipelineRunV2 = usePipelineRunV2 as jest.Mock;
const mockUseTaskRunsForPipelineRuns = useTaskRunsForPipelineRuns as jest.Mock;

// Shared mock state helpers
const mockPipelineRunStates = createPipelineRunMockStates();
const mockTaskRunsStates = createTaskRunsMockStates();

describe('PipelineRunDetailsTab', () => {
  const mockNamespace = 'test-namespace';
  const mockPipelineRunName = 'test-pipeline-run';

  const mockUrlInfo = {
    fullUrl: 'https://image-rbac-proxy',
    hostname: 'image-rbac-proxy',
    oauthPath: '/oauth',
    buildUrl: (path: string) => `https://image-rbac-proxy${path}`,
  };

  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);
  const useParamsMock = createUseParamsMock();

  // Mock getBBox for PatternFly Topology visualization
  beforeAll(() => {
    setupGetBBoxMock();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue(mockNamespace);
    useParamsMock.mockReturnValue({ pipelineRunName: mockPipelineRunName });
    // Default: image proxy and repository are loaded with public visibility
    mockUseImageProxy.mockReturnValue([mockUrlInfo, true, null]);
    mockUseImageRepository.mockReturnValue([mockPublicImageRepository, true, null]);
  });

  it('should render spinner when loading pipeline run', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loading());
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded([]));

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render spinner when loading task runs', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loading());

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should call hooks with correct parameters', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(mockUsePipelineRunV2).toHaveBeenCalledWith(mockNamespace, mockPipelineRunName);
    expect(mockUseTaskRunsForPipelineRuns).toHaveBeenCalledWith(mockNamespace, mockPipelineRunName);
  });

  it('should render error state when pipeline run fails to load', () => {
    mockUsePipelineRunV2.mockReturnValue(
      mockPipelineRunStates.error({ message: 'Pipeline run not found', code: 404 }),
    );
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
  });

  it('should render PipelineRunVisualization when data is loaded', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    // Check that the title is rendered
    const title = screen.getByText('Pipeline run details');
    expect(title).toBeInTheDocument();

    // Check that pipeline run details section is rendered (not error state)
    expect(screen.getByText('test-pipeline-run')).toBeInTheDocument();
  });

  it('should render error state when task runs fail to load', () => {
    const mockError = new Error('Task runs error');
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.error(mockError));

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    // Should still render the page but show error instead of visualization
    expect(screen.getByText(/Unable to load task runs/i)).toBeInTheDocument();
    expect(screen.queryByTestId('pipelinerun-graph')).not.toBeInTheDocument();
  });

  it('should render pipeline run details when loaded', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    // Find the main heading and verify content
    const heading = screen.getByRole('heading', { name: 'Pipeline run details' });
    expect(heading).toBeInTheDocument();

    // Find description lists and verify they contain the data
    const descriptionLists = screen.getAllByTestId('pipelinerun-details');
    const combinedText = descriptionLists.map((dl) => dl.textContent).join(' ');
    expect(combinedText).toContain('test-pipeline-run');
    expect(combinedText).toContain('test-namespace');
    expect(combinedText).toContain('test-pipeline');
  });

  it('should display application name with link', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    const appLink = screen.getByRole('link', { name: 'test-app' });
    expect(appLink).toBeInTheDocument();
    expect(appLink).toHaveAttribute('href', '/ns/test-namespace/applications/test-app');
  });

  it('should display component name with link', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    const componentLink = screen.getByRole('link', { name: 'test-component' });
    expect(componentLink).toBeInTheDocument();
    expect(componentLink).toHaveAttribute(
      'href',
      '/ns/test-namespace/applications/test-app/components/test-component',
    );
  });

  it('should display calculated duration', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    // Check Duration label and value (5 minutes from mock data)
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('5 minutes')).toBeInTheDocument();
  });

  it('should display code block in message field when pipeline run failed', () => {
    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(failedPipelineRun));
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(screen.getByTestId('message-code-block')).toBeInTheDocument();
  });

  it('should not display code block in message field when pipeline run failed and message is the same as the static message', () => {
    mockUsePipelineRunV2.mockReturnValue(
      mockPipelineRunStates.loaded(testPipelineRuns[DataState.TASK_RUN_CANCELLED]),
    );
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(screen.queryByTestId('message-code-block')).toBeNull();
  });

  it('should not display code block in message field when pipeline run succeeded', () => {
    mockUsePipelineRunV2.mockReturnValue(
      mockPipelineRunStates.loaded(testPipelineRuns[DataState.SUCCEEDED]),
    );
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(screen.queryByTestId('message-code-block')).toBeNull();
  });

  it('should render RunParamsList when spec params are available', () => {
    const pipelineRunWithParams = {
      ...mockPipelineRun,
      spec: {
        ...mockPipelineRun.spec,
        params: [
          { name: 'param1', value: 'value1' },
          { name: 'param2', value: ['array', 'value'] },
        ],
      },
    } as PipelineRunKind;

    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(pipelineRunWithParams));
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(screen.getByTestId('run-params-list')).toBeInTheDocument();
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('param1')).toBeInTheDocument();
    expect(screen.getByText('value1')).toBeInTheDocument();
    expect(screen.getByText('param2')).toBeInTheDocument();
    expect(screen.getByText('array, value')).toBeInTheDocument();
  });

  it('should not render RunParamsList when spec params are not available', () => {
    const pipelineRunWithoutParams = {
      ...mockPipelineRun,
      spec: {
        ...mockPipelineRun.spec,
        params: undefined,
      },
    } as PipelineRunKind;

    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(pipelineRunWithoutParams));
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(screen.queryByTestId('run-params-list')).not.toBeInTheDocument();
  });

  it('should not render RunParamsList when spec params array is empty', () => {
    const pipelineRunWithEmptyParams = {
      ...mockPipelineRun,
      spec: {
        ...mockPipelineRun.spec,
        params: [],
      },
    } as PipelineRunKind;

    mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(pipelineRunWithEmptyParams));
    mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));

    renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

    expect(screen.queryByTestId('run-params-list')).not.toBeInTheDocument();
  });

  describe('Proxy URL replacement for private images', () => {
    const konfluxImageUrl = 'quay.io/redhat-user-workloads/test-ns/test-component@sha256:abc123';
    const proxyImageUrl =
      'image-rbac-proxy/redhat-user-workloads/test-ns/test-component@sha256:abc123';
    const userOwnedImageUrl = 'quay.io/user/my-app@sha256:abc123';
    const pipelineRunWithImageUrl = {
      ...mockPipelineRun,
      status: {
        ...mockPipelineRun.status,
        results: [
          { name: 'IMAGE_URL', value: konfluxImageUrl },
          { name: 'OTHER_RESULT', value: 'some-value' },
        ],
      },
    } as PipelineRunKind;
    const pipelineRunWithOutputImage = {
      ...mockPipelineRun,
      spec: {
        ...mockPipelineRun.spec,
        params: [
          { name: 'output-image', value: konfluxImageUrl },
          { name: 'other-param', value: 'other-value' },
        ],
      },
    } as PipelineRunKind;
    const pipelineRunWithUserImage = {
      ...mockPipelineRun,
      status: {
        ...mockPipelineRun.status,
        results: [{ name: 'IMAGE_URL', value: userOwnedImageUrl }],
      },
    } as PipelineRunKind;

    it('should replace quay.io with proxy hostname in IMAGE_URL result for private Konflux images', () => {
      mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(pipelineRunWithImageUrl));
      mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));
      mockUseImageRepository.mockReturnValue([mockPrivateImageRepository, true, null]);

      renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

      // The IMAGE_URL should be replaced with proxy URL
      expect(screen.getByText(proxyImageUrl)).toBeInTheDocument();
      // Other results should remain unchanged
      expect(screen.getByText('some-value')).toBeInTheDocument();
    });

    it('should not replace URL in results for public images', () => {
      mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(pipelineRunWithImageUrl));
      mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));
      mockUseImageRepository.mockReturnValue([mockPublicImageRepository, true, null]);

      renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

      // The IMAGE_URL should remain unchanged for public images
      expect(screen.getByText(konfluxImageUrl)).toBeInTheDocument();
    });

    it('should replace quay.io with proxy hostname in output-image param for private Konflux images', () => {
      mockUsePipelineRunV2.mockReturnValue(
        mockPipelineRunStates.loaded(pipelineRunWithOutputImage),
      );
      mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));
      mockUseImageRepository.mockReturnValue([mockPrivateImageRepository, true, null]);

      renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

      // The output-image param should be replaced with proxy URL
      expect(screen.getByText(proxyImageUrl)).toBeInTheDocument();
      // Other params should remain unchanged
      expect(screen.getByText('other-value')).toBeInTheDocument();
    });

    it('should not replace URL in params for public images', () => {
      mockUsePipelineRunV2.mockReturnValue(
        mockPipelineRunStates.loaded(pipelineRunWithOutputImage),
      );
      mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));
      mockUseImageRepository.mockReturnValue([mockPublicImageRepository, true, null]);

      renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

      // The output-image param should remain unchanged for public images
      expect(screen.getByText(konfluxImageUrl)).toBeInTheDocument();
    });

    it('should use proxy URL in SBOM download command for private Konflux images', () => {
      const pipelineRunWithBuildImage = {
        ...mockPipelineRun,
        metadata: {
          ...mockPipelineRun.metadata,
          annotations: {
            [PipelineRunLabel.BUILD_IMAGE_ANNOTATION]: konfluxImageUrl,
          },
        },
      } as PipelineRunKind;

      mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(pipelineRunWithBuildImage));
      mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));
      mockUseImageRepository.mockReturnValue([mockPrivateImageRepository, true, null]);

      renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

      // The SBOM download command should use proxy URL
      expect(screen.getByLabelText('Copyable input')).toHaveValue(
        `cosign download sbom ${proxyImageUrl}`,
      );
    });

    it('should not replace URL in SBOM download command for public images', () => {
      const pipelineRunWithBuildImage = {
        ...mockPipelineRun,
        metadata: {
          ...mockPipelineRun.metadata,
          annotations: {
            [PipelineRunLabel.BUILD_IMAGE_ANNOTATION]: konfluxImageUrl,
          },
        },
      } as PipelineRunKind;

      mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(pipelineRunWithBuildImage));
      mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));
      mockUseImageRepository.mockReturnValue([mockPublicImageRepository, true, null]);

      renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

      // The SBOM download command should use original URL for public images.

      expect(screen.getByLabelText('Copyable input')).toHaveValue(
        `cosign download sbom ${konfluxImageUrl}`,
      );
    });

    it('should handle missing proxy URL gracefully', () => {
      mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(pipelineRunWithImageUrl));
      mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));
      mockUseImageRepository.mockReturnValue([mockPrivateImageRepository, true, null]);
      mockUseImageProxy.mockReturnValue([null, true, null]);

      renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

      // Should fall back to original URL when proxy info is not available
      expect(screen.getAllByText(konfluxImageUrl).length).toBeGreaterThan(0);
    });

    it('should handle image repository errors gracefully', () => {
      mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(pipelineRunWithImageUrl));
      mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));
      mockUseImageRepository.mockReturnValue([null, true, new Error('Failed to fetch')]);

      renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

      // Should fall back to original URL when image repository fails
      expect(screen.getAllByText(konfluxImageUrl).length).toBeGreaterThan(0);
    });

    it('should render content without waiting for image repository to load', () => {
      mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));
      mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));
      mockUseImageRepository.mockReturnValue([null, false, null]); // imageRepo still loading

      renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

      expect(screen.getByRole('heading', { name: 'Pipeline run details' })).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should render content without waiting for proxy to load', () => {
      mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(mockPipelineRun));
      mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));
      mockUseImageRepository.mockReturnValue([mockPrivateImageRepository, true, null]);
      mockUseImageProxy.mockReturnValue([null, false, null]); // proxy still loading

      renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

      // Should render details immediately; proxy loading does not block the tab
      expect(screen.getByRole('heading', { name: 'Pipeline run details' })).toBeInTheDocument();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should show original URL when image repository is still loading', () => {
      mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(pipelineRunWithImageUrl));
      mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));
      mockUseImageRepository.mockReturnValue([null, false, null]); // imageRepo still loading

      renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

      expect(screen.getByText(konfluxImageUrl)).toBeInTheDocument();
      expect(screen.queryByText(proxyImageUrl)).not.toBeInTheDocument();
    });

    it('should show original URL when proxy is still loading', () => {
      mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(pipelineRunWithImageUrl));
      mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));
      mockUseImageRepository.mockReturnValue([mockPrivateImageRepository, true, null]);
      mockUseImageProxy.mockReturnValue([null, false, null]); // proxy still loading

      renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

      expect(screen.getByText(konfluxImageUrl)).toBeInTheDocument();
      expect(screen.queryByText(proxyImageUrl)).not.toBeInTheDocument();
    });

    it('should not use proxy URL for user-owned private repositories', () => {
      mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(pipelineRunWithUserImage));
      mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));
      mockUseImageRepository.mockReturnValue([mockPrivateImageRepository, true, null]);

      renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

      // User-owned repo should NOT use proxy URL even if private
      expect(screen.getAllByText(userOwnedImageUrl).length).toBeGreaterThan(0);
    });

    it('should not use proxy URL in params for user-owned private repositories', () => {
      mockUsePipelineRunV2.mockReturnValue(mockPipelineRunStates.loaded(pipelineRunWithUserImage));
      mockUseTaskRunsForPipelineRuns.mockReturnValue(mockTaskRunsStates.loaded(mockTaskRuns));
      mockUseImageRepository.mockReturnValue([mockPrivateImageRepository, true, null]);

      renderWithQueryClientAndRouter(<PipelineRunDetailsTab />);

      // User-owned repo should NOT use proxy URL in params even if private
      expect(screen.getAllByText(userOwnedImageUrl).length).toBeGreaterThan(0);
    });
  });
});
