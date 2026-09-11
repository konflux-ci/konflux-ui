import { screen } from '@testing-library/react';
import { useRoxctlCveReport } from '~/components/PipelineRun/VulnerabilitiesTab/useRoxctlCveReport';
import { ROXCTL_SCAN_TASK } from '~/consts/security';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { TektonResourceLabel } from '~/types';
import type { TaskRunKind } from '~/types';
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

jest.mock('~/components/PipelineRun/VulnerabilitiesTab/useRoxctlCveReport', () => ({
  useRoxctlCveReport: jest.fn(),
}));

const useTaskRunsMock = useTaskRunsForPipelineRuns as jest.Mock;
const useRoxctlCveReportMock = useRoxctlCveReport as jest.Mock;

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
    useRoxctlCveReportMock.mockReturnValue({ data: [], isLoading: false, error: null });
  });

  it('should show loading spinner while task runs are loading', () => {
    useTaskRunsMock.mockReturnValue([[], false, null]);

    renderWithQueryClientAndRouter(<PipelineRunVulnerabilitiesTab />);
    screen.getByRole('progressbar');
  });

  it('should show unavailable state when roxctl-scan task run is missing', () => {
    useTaskRunsMock.mockReturnValue([[], true, null]);

    renderWithQueryClientAndRouter(<PipelineRunVulnerabilitiesTab />);
    screen.getByText('No vulnerability scan found');
    screen.getByText('This pipeline run does not include a roxctl-scan task run.');
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
});
