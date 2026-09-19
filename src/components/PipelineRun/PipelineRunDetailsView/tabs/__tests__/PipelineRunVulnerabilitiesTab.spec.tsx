import { screen } from '@testing-library/react';
import { useRoxctlCveReport } from '~/components/PipelineRun/VulnerabilitiesTab/useRoxctlCveReport';
import { ROXCTL_SCAN_TASK } from '~/consts/security';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import {
  TektonResourceLabel,
  type PipelineRunKind,
  type PipelineRunStatus,
  type TaskRunKind,
} from '~/types';
import { setupVirtualizerMock, renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createUseParamsMock } from '~/unit-test-utils/mock-react-router';
import { PipelineRunVulnerabilitiesTab } from '../PipelineRunVulnerabilitiesTab';

jest.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: jest.fn(),
}));

beforeAll(() => {
  window.matchMedia = jest.fn().mockImplementation((query: string) => ({
    matches: true,
    media: query,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    onchange: null,
    dispatchEvent: jest.fn(),
  }));
});

beforeEach(() => {
  setupVirtualizerMock();
});

jest.mock('~/hooks/useTaskRunsV2', () => ({
  useTaskRunsForPipelineRuns: jest.fn(),
}));

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunV2: jest.fn(),
}));

jest.mock('~/components/PipelineRun/VulnerabilitiesTab/useRoxctlCveReport', () => ({
  useRoxctlCveReport: jest.fn(),
}));

const useTaskRunsMock = useTaskRunsForPipelineRuns as jest.Mock;
const usePipelineRunMock = usePipelineRunV2 as jest.Mock;
const useRoxctlCveReportMock = useRoxctlCveReport as jest.Mock;

const mockSucceededPipelineRunStatus = {
  conditions: [{ type: 'Succeeded', status: 'True', reason: 'Succeeded' }],
  pipelineSpec: {
    tasks: [{ name: ROXCTL_SCAN_TASK }],
  },
} satisfies PipelineRunStatus;

const mockCompletedPipelineRun: PipelineRunKind = {
  apiVersion: 'tekton.dev/v1',
  kind: 'PipelineRun',
  metadata: {
    name: 'test-pipeline-run',
    namespace: 'test-ns',
  },
  spec: {},
  status: mockSucceededPipelineRunStatus,
};

const mockRunningPipelineRun: PipelineRunKind = {
  ...mockCompletedPipelineRun,
  status: {
    ...mockSucceededPipelineRunStatus,
    conditions: [{ type: 'Succeeded', status: 'Unknown', reason: 'Running' }],
  },
};

const mockRoxctlTaskRun: TaskRunKind = {
  apiVersion: 'tekton.dev/v1',
  kind: 'TaskRun',
  metadata: {
    name: 'roxctl-scan-run',
    namespace: 'test-ns',
    uid: 'tr-uid-1',
    labels: {
      [TektonResourceLabel.pipelineTask]: ROXCTL_SCAN_TASK,
    },
  },
  spec: {},
  status: {
    podName: 'roxctl-scan-pod',
    conditions: [],
  },
};

describe('PipelineRunVulnerabilitiesTab', () => {
  mockUseNamespaceHook('test-ns');
  createUseParamsMock({ pipelineRunName: 'test-pipeline-run' });

  beforeEach(() => {
    jest.clearAllMocks();
    usePipelineRunMock.mockReturnValue([mockCompletedPipelineRun, true, null]);
    useRoxctlCveReportMock.mockReturnValue({ data: [], isLoading: false, error: null });
  });

  it('should show loading spinner while task runs are loading', () => {
    useTaskRunsMock.mockReturnValue([[], false, null]);

    renderWithQueryClientAndRouter(<PipelineRunVulnerabilitiesTab />);
    screen.getByRole('progressbar');
  });

  it('should show empty state when a finished pipeline has no scan data', () => {
    useTaskRunsMock.mockReturnValue([[], true, null]);

    renderWithQueryClientAndRouter(<PipelineRunVulnerabilitiesTab />);
    screen.getByText('No vulnerability scan found');
    screen.getByText('No vulnerability scan data is available for this pipeline run.');
  });

  it('should show a waiting state when the pipeline is still running without a scan task run', () => {
    usePipelineRunMock.mockReturnValue([mockRunningPipelineRun, true, null]);
    useTaskRunsMock.mockReturnValue([[], true, null]);

    renderWithQueryClientAndRouter(<PipelineRunVulnerabilitiesTab />);

    screen.getByText('Waiting for vulnerability scan');
    screen.getByText(
      'The pipeline run is still in progress. The roxctl-scan task has not started yet.',
    );
  });

  it('should show a spinner when Tekton created the task run but it is not listed yet', () => {
    usePipelineRunMock.mockReturnValue([
      {
        ...mockRunningPipelineRun,
        status: {
          ...mockSucceededPipelineRunStatus,
          conditions: [{ type: 'Succeeded', status: 'Unknown', reason: 'Running' }],
          childReferences: [
            { name: 'roxctl-scan-run', pipelineTaskName: ROXCTL_SCAN_TASK, kind: 'TaskRun' },
          ],
        },
      },
      true,
      null,
    ]);
    useTaskRunsMock.mockReturnValue([[], true, null]);

    renderWithQueryClientAndRouter(<PipelineRunVulnerabilitiesTab />);
    screen.getByRole('progressbar');
  });

  it('should show skipped state when roxctl-scan was skipped', () => {
    usePipelineRunMock.mockReturnValue([
      {
        ...mockCompletedPipelineRun,
        status: {
          ...mockSucceededPipelineRunStatus,
          skippedTasks: [{ name: ROXCTL_SCAN_TASK }],
        },
      },
      true,
      null,
    ]);
    useTaskRunsMock.mockReturnValue([[], true, null]);

    renderWithQueryClientAndRouter(<PipelineRunVulnerabilitiesTab />);
    screen.getByText('Vulnerability scan skipped');
    screen.getByText('The roxctl-scan task was skipped for this pipeline run.');
  });

  it('should show error state when task runs fail to load', () => {
    useTaskRunsMock.mockReturnValue([[], true, new Error('Failed to fetch task runs')]);

    renderWithQueryClientAndRouter(<PipelineRunVulnerabilitiesTab />);
    screen.getByText('Unable to load task runs');
  });

  it('should load vulnerabilities for the roxctl-scan task run', () => {
    useTaskRunsMock.mockReturnValue([[mockRoxctlTaskRun], true, null]);
    useRoxctlCveReportMock.mockReturnValue({
      data: [
        {
          cve: 'CVE-2024-1234',
          severity: 'CRITICAL',
          componentName: 'openssl',
          componentVersion: '1.0.0',
          fixedBy: '1.0.1',
        },
      ],
      isLoading: false,
      error: null,
    });

    renderWithQueryClientAndRouter(<PipelineRunVulnerabilitiesTab />);
    screen.getByTestId('vulnerabilities-tab');
    expect(useRoxctlCveReportMock).toHaveBeenCalledWith(mockRoxctlTaskRun);
  });

  it('should filter task runs by the roxctl-scan pipeline task', () => {
    useTaskRunsMock.mockReturnValue([[], true, null]);

    renderWithQueryClientAndRouter(<PipelineRunVulnerabilitiesTab />);

    expect(useTaskRunsMock).toHaveBeenCalledWith('test-ns', 'test-pipeline-run', ROXCTL_SCAN_TASK);
  });
});
