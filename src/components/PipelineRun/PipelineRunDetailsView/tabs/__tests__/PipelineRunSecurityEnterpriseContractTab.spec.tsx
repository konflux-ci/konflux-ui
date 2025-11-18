import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { createUseParamsMock, routerRenderer } from '~/unit-test-utils/mock-react-router';
import { PipelineRunSecurityEnterpriseContractTab } from '../PipelineRunSecurityEnterpriseContractTab';

const mockUseEnterpriseContractResults = jest.fn();

jest.mock('~/components/EnterpriseContract/useEnterpriseContractResultFromLogs', () => ({
  useEnterpriseContractResults: (...args: unknown[]) => mockUseEnterpriseContractResults(...args),
}));

describe('PipelineRunSecurityEnterpriseContractTab', () => {
  const useParamsMock = createUseParamsMock();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEnterpriseContractResults.mockReturnValue([[], true]);
  });

  it('should render SecurityEnterpriseContractTab with pipelineRunName from params', () => {
    const mockPipelineRunName = 'test-pipeline-run-123';
    useParamsMock.mockReturnValue({ pipelineRunName: mockPipelineRunName });

    routerRenderer(<PipelineRunSecurityEnterpriseContractTab />);

    expect(mockUseEnterpriseContractResults).toHaveBeenCalledWith(mockPipelineRunName);
  });

  it('should pass undefined pipelineRunName when not in params', () => {
    useParamsMock.mockReturnValue({});

    routerRenderer(<PipelineRunSecurityEnterpriseContractTab />);

    expect(mockUseEnterpriseContractResults).toHaveBeenCalledWith(undefined);
  });

  it('should render loading state when data is loading', () => {
    mockUseEnterpriseContractResults.mockReturnValue([undefined, false]);
    useParamsMock.mockReturnValue({ pipelineRunName: 'test-pipeline-run' });

    routerRenderer(<PipelineRunSecurityEnterpriseContractTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render empty state when there are no results', () => {
    mockUseEnterpriseContractResults.mockReturnValue([undefined, true]);
    useParamsMock.mockReturnValue({ pipelineRunName: 'test-pipeline-run' });

    routerRenderer(<PipelineRunSecurityEnterpriseContractTab />);

    expect(screen.getByText(/Security information unavailable/i)).toBeInTheDocument();
  });

  it('should render SecurityEnterpriseContractTab content when data is loaded', () => {
    mockUseEnterpriseContractResults.mockReturnValue([[], true]);
    useParamsMock.mockReturnValue({ pipelineRunName: 'test-pipeline-run' });

    routerRenderer(<PipelineRunSecurityEnterpriseContractTab />);

    expect(screen.getByText('Testing apps against Enterprise Contract')).toBeInTheDocument();
  });
});
