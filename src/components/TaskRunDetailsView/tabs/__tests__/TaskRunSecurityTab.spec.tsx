import { screen } from '@testing-library/react';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { useTaskRunV2 } from '../../../../hooks/useTaskRunsV2';
import { renderWithQueryClientAndRouter } from '../../../../unit-test-utils/rendering-utils';
import { createUseParamsMock } from '../../../../utils/test-utils';
import { mockConformaUIData } from '../../../Conforma/__data__/mockConformaLogsJson';
import { useConformaResult } from '../../../Conforma/useConformaResult';
import { testTaskRuns } from '../../../TaskRunListView/__data__/mock-TaskRun-data';
import { TaskRunSecurityTab } from '../TaskRunSecurityTab';

jest.mock('../../../../hooks/useTaskRunsV2', () => ({
  useTaskRunV2: jest.fn(),
}));

jest.mock('../../../Conforma/useConformaResult', () => ({
  useConformaResult: jest.fn(),
}));

const mockUseTaskRunV2 = useTaskRunV2 as jest.Mock;
const mockUseConformaResult = useConformaResult as jest.Mock;

describe('TaskRunSecurityTab', () => {
  createUseParamsMock({ taskRunName: 'test-taskrun' });
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConformaResult.mockReturnValue([mockConformaUIData, true]);
  });

  it('should handle error when taskrun fails to load', () => {
    mockUseTaskRunV2.mockReturnValue([null, false]);

    renderWithQueryClientAndRouter(<TaskRunSecurityTab />);

    expect(screen.queryByText('Testing apps against Conforma')).not.toBeInTheDocument();
  });

  it('should handle error when conforma fails to load', () => {
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

    mockUseConformaResult.mockReturnValue([null, false, undefined]);

    renderWithQueryClientAndRouter(<TaskRunSecurityTab />);

    expect(screen.queryByText('Testing apps against Conforma')).not.toBeInTheDocument();
  });

  it('should render spinner when taskrun data is not loaded', () => {
    mockUseTaskRunV2.mockReturnValue([null, false]);

    renderWithQueryClientAndRouter(<TaskRunSecurityTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByText('Testing apps against Conforma')).not.toBeInTheDocument();
  });

  it('should render SecurityTab when taskrun is loaded with pipelineRun label', () => {
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

    renderWithQueryClientAndRouter(<TaskRunSecurityTab />);

    expect(mockUseConformaResult).toHaveBeenCalledWith('test-pipelinerun');
    expect(screen.getByText('Testing apps against Conforma')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should call useTaskRunV2 with correct parameters', () => {
    mockUseTaskRunV2.mockReturnValue([testTaskRuns[0], true]);

    renderWithQueryClientAndRouter(<TaskRunSecurityTab />);

    expect(mockUseTaskRunV2).toHaveBeenCalledWith('test-ns', 'test-taskrun');
  });

  it('should render SecurityTab with correct pipelineRun when taskrun has different label key', () => {
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

    renderWithQueryClientAndRouter(<TaskRunSecurityTab />);

    expect(mockUseConformaResult).toHaveBeenCalledWith('different-pipelinerun');
    expect(screen.getByText('Testing apps against Conforma')).toBeInTheDocument();
  });
});
