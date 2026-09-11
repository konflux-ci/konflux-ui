import { screen } from '@testing-library/react';
import { ROXCTL_SCAN_TASK } from '~/consts/security';
import { useTaskRunV2 } from '~/hooks/useTaskRunsV2';
import { TektonResourceLabel } from '~/types';
import type { TaskRunKind } from '~/types';
import { setupVirtualizerMock, renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createUseParamsMock } from '~/unit-test-utils/mock-react-router';
import { useRoxctlCveReport } from '../useRoxctlCveReport';
import { VulnerabilitiesTab } from '../VulnerabilitiesTab';

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
  useTaskRunV2: jest.fn(),
}));

jest.mock('../useRoxctlCveReport', () => ({
  useRoxctlCveReport: jest.fn(),
}));

const useTaskRunMock = useTaskRunV2 as jest.Mock;
const useRoxctlCveReportMock = useRoxctlCveReport as jest.Mock;

const mockTaskRun: TaskRunKind = {
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

describe('VulnerabilitiesTab', () => {
  mockUseNamespaceHook('test-ns');
  createUseParamsMock({ taskRunName: 'roxctl-scan-run' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading spinner while taskRun is loading', () => {
    useTaskRunMock.mockReturnValue([null, false]);
    useRoxctlCveReportMock.mockReturnValue({ data: [], isLoading: false, error: null });

    renderWithQueryClientAndRouter(<VulnerabilitiesTab />);
    screen.getByRole('progressbar');
  });

  it('should show loading spinner while CVE data is loading', () => {
    useTaskRunMock.mockReturnValue([mockTaskRun, true]);
    useRoxctlCveReportMock.mockReturnValue({ data: [], isLoading: true, error: null });

    renderWithQueryClientAndRouter(<VulnerabilitiesTab />);
    screen.getByRole('progressbar');
  });

  it('should show error state when CVE fetch fails', () => {
    useTaskRunMock.mockReturnValue([mockTaskRun, true]);
    useRoxctlCveReportMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('No valid roxctl CVE report JSON found'),
    });

    renderWithQueryClientAndRouter(<VulnerabilitiesTab />);
    screen.getByText('Unable to load vulnerabilities');
    screen.getByText('No valid roxctl CVE report JSON found');
  });

  it('should show generic error message for non-Error objects', () => {
    useTaskRunMock.mockReturnValue([mockTaskRun, true]);
    useRoxctlCveReportMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: 'something broke',
    });

    renderWithQueryClientAndRouter(<VulnerabilitiesTab />);
    screen.getByText('Unable to load vulnerabilities');
    screen.getByText('An unexpected error occurred.');
  });

  it('should render the vulnerabilities table when loaded with data', () => {
    useTaskRunMock.mockReturnValue([mockTaskRun, true]);
    useRoxctlCveReportMock.mockReturnValue({
      data: [
        {
          cve: 'CVE-2024-1234',
          severity: 'CRITICAL',
          componentName: 'openssl',
          componentVersion: '1.0.0',
          fixedBy: '1.0.1',
        },
        {
          cve: 'CVE-2023-5678',
          severity: 'HIGH',
          componentName: 'nodejs',
          componentVersion: '18.0.0',
          fixedBy: '18.0.1',
        },
      ],
      isLoading: false,
      error: null,
    });

    renderWithQueryClientAndRouter(<VulnerabilitiesTab />);
    screen.getByTestId('vulnerabilities-tab');
  });

  it('should show no-data empty state when data is empty', () => {
    useTaskRunMock.mockReturnValue([mockTaskRun, true]);
    useRoxctlCveReportMock.mockReturnValue({ data: [], isLoading: false, error: null });

    renderWithQueryClientAndRouter(<VulnerabilitiesTab />);
    screen.getByText('No fixable vulnerabilities found');
  });
});
