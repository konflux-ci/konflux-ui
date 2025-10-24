import { screen } from '@testing-library/react';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { useTaskRunV2 } from '../../../../hooks/useTaskRunsV2';
import { renderWithQueryClientAndRouter } from '../../../../unit-test-utils/rendering-utils';
import { createUseParamsMock } from '../../../../utils/test-utils';
import { testTaskRuns } from '../../../TaskRunListView/__data__/mock-TaskRun-data';
import { TaskrunSecurityEnterpriseContractTab } from '../TaskRunSecurityEnterpriseContractTab';

jest.mock('../../../../hooks/useTaskRunsV2', () => ({
  useTaskRunV2: jest.fn(),
}));

// Mock the SecurityEnterpriseContractTab component
jest.mock('../../../EnterpriseContract/SecurityEnterpriseContractTab', () => ({
  SecurityEnterpriseContractTab: ({ pipelineRun }: { pipelineRun: string }) => (
    <div data-test="security-enterprise-contract-tab">
      Security Tab for PipelineRun: {pipelineRun || 'undefined'}
    </div>
  ),
}));

const mockUseTaskRunV2 = useTaskRunV2 as jest.Mock;

describe('TaskrunSecurityEnterpriseContractTab', () => {
  createUseParamsMock({ taskRunName: 'test-taskrun' });
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render spinner when taskrun data is not loaded', () => {
    mockUseTaskRunV2.mockReturnValue([null, false]);

    renderWithQueryClientAndRouter(<TaskrunSecurityEnterpriseContractTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('security-enterprise-contract-tab')).not.toBeInTheDocument();
  });

  it('should render SecurityEnterpriseContractTab when taskrun is loaded with pipelineRun label', () => {
    const mockTaskRun = {
      ...testTaskRuns[0],
      metadata: {
        ...testTaskRuns[0].metadata,
        labels: {
          'tekton.dev/pipelineRun': 'test-pipelinerun',
        },
      },
    };

    mockUseTaskRunV2.mockReturnValue([mockTaskRun, true]);

    renderWithQueryClientAndRouter(<TaskrunSecurityEnterpriseContractTab />);

    expect(screen.getByTestId('security-enterprise-contract-tab')).toBeInTheDocument();
    expect(screen.getByText('Security Tab for PipelineRun: test-pipelinerun')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should render SecurityEnterpriseContractTab with undefined pipelineRun when label is missing', () => {
    const mockTaskRun = {
      ...testTaskRuns[0],
      metadata: {
        ...testTaskRuns[0].metadata,
        labels: {},
      },
    };

    mockUseTaskRunV2.mockReturnValue([mockTaskRun, true]);

    renderWithQueryClientAndRouter(<TaskrunSecurityEnterpriseContractTab />);

    expect(screen.getByTestId('security-enterprise-contract-tab')).toBeInTheDocument();
    expect(screen.getByText('Security Tab for PipelineRun: undefined')).toBeInTheDocument();
  });

  it('should render SecurityEnterpriseContractTab with undefined pipelineRun when metadata is missing', () => {
    const mockTaskRun = {
      ...testTaskRuns[0],
      metadata: undefined,
    };

    mockUseTaskRunV2.mockReturnValue([mockTaskRun, true]);

    renderWithQueryClientAndRouter(<TaskrunSecurityEnterpriseContractTab />);

    expect(screen.getByTestId('security-enterprise-contract-tab')).toBeInTheDocument();
    expect(screen.getByText('Security Tab for PipelineRun: undefined')).toBeInTheDocument();
  });

  it('should call useTaskRunV2 with correct parameters', () => {
    mockUseTaskRunV2.mockReturnValue([testTaskRuns[0], true]);

    renderWithQueryClientAndRouter(<TaskrunSecurityEnterpriseContractTab />);

    expect(mockUseTaskRunV2).toHaveBeenCalledWith('test-ns', 'test-taskrun');
  });

  it('should render SecurityEnterpriseContractTab with correct pipelineRun when taskrun has different label key', () => {
    const mockTaskRun = {
      ...testTaskRuns[0],
      metadata: {
        ...testTaskRuns[0].metadata,
        labels: {
          'app.kubernetes.io/name': 'some-app',
          'tekton.dev/pipelineRun': 'different-pipelinerun',
        },
      },
    };

    mockUseTaskRunV2.mockReturnValue([mockTaskRun, true]);

    renderWithQueryClientAndRouter(<TaskrunSecurityEnterpriseContractTab />);

    expect(screen.getByTestId('security-enterprise-contract-tab')).toBeInTheDocument();
    expect(
      screen.getByText('Security Tab for PipelineRun: different-pipelinerun'),
    ).toBeInTheDocument();
  });
});
