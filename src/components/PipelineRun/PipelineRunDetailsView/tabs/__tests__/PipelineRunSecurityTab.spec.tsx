import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { createUseParamsMock, routerRenderer } from '~/unit-test-utils/mock-react-router';
import { PipelineRunSecurityTab } from '../PipelineRunSecurityTab';

const mockUseConformaResult = jest.fn();

jest.mock('~/components/Conforma/useConformaResult', () => ({
  useConformaResult: (...args: unknown[]) => mockUseConformaResult(...args),
}));

describe('PipelineRunSecurityTab', () => {
  const useParamsMock = createUseParamsMock();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseConformaResult.mockReturnValue([[], true]);
  });

  it('should render SecurityTab with pipelineRunName from params', () => {
    const mockPipelineRunName = 'test-pipeline-run-123';
    useParamsMock.mockReturnValue({ pipelineRunName: mockPipelineRunName });

    routerRenderer(<PipelineRunSecurityTab />);

    expect(mockUseConformaResult).toHaveBeenCalledWith(mockPipelineRunName);
  });

  it('should pass undefined pipelineRunName when not in params', () => {
    useParamsMock.mockReturnValue({});

    routerRenderer(<PipelineRunSecurityTab />);

    expect(mockUseConformaResult).toHaveBeenCalledWith(undefined);
  });

  it('should render loading state when data is loading', () => {
    mockUseConformaResult.mockReturnValue([undefined, false]);
    useParamsMock.mockReturnValue({ pipelineRunName: 'test-pipeline-run' });

    routerRenderer(<PipelineRunSecurityTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render empty state when there are no results', () => {
    mockUseConformaResult.mockReturnValue([undefined, true]);
    useParamsMock.mockReturnValue({ pipelineRunName: 'test-pipeline-run' });

    routerRenderer(<PipelineRunSecurityTab />);

    expect(screen.getByText(/Security information unavailable/i)).toBeInTheDocument();
  });

  it('should render SecurityTab content when data is loaded', () => {
    mockUseConformaResult.mockReturnValue([[], true]);
    useParamsMock.mockReturnValue({ pipelineRunName: 'test-pipeline-run' });

    routerRenderer(<PipelineRunSecurityTab />);

    expect(screen.getByText('Testing apps against Conforma')).toBeInTheDocument();
  });
});
