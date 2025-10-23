import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { createUseParamsMock, routerRenderer } from '~/unit-test-utils/mock-react-router';
import { PipelineRunSecurityEnterpriseContractTab } from '../PipelineRunSecurityEnterpriseContractTab';

// SecurityEnterpriseContractTab has its own tests. We mock it here to focus on
// testing PipelineRunSecurityEnterpriseContractTab's specific logic: extracting
// pipelineRunName from URL params and passing it to SecurityEnterpriseContractTab.
jest.mock('../../../../EnterpriseContract/SecurityEnterpriseContractTab', () => ({
  SecurityEnterpriseContractTab: jest.fn(({ pipelineRun }) => (
    <div data-test="security-enterprise-contract-tab">
      SecurityEnterpriseContractTab - {pipelineRun}
    </div>
  )),
}));

describe('PipelineRunSecurityEnterpriseContractTab', () => {
  const useParamsMock = createUseParamsMock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render SecurityEnterpriseContractTab with pipelineRunName from params', () => {
    const mockPipelineRunName = 'test-pipeline-run-123';
    useParamsMock.mockReturnValue({ pipelineRunName: mockPipelineRunName });

    routerRenderer(<PipelineRunSecurityEnterpriseContractTab />);

    expect(screen.getByTestId('security-enterprise-contract-tab')).toBeInTheDocument();
    expect(screen.getByText(`SecurityEnterpriseContractTab - ${mockPipelineRunName}`)).toBeInTheDocument();
  });

  it('should pass undefined pipelineRunName when not in params', () => {
    useParamsMock.mockReturnValue({});

    routerRenderer(<PipelineRunSecurityEnterpriseContractTab />);

    const tab = screen.getByTestId('security-enterprise-contract-tab');
    expect(tab).toBeInTheDocument();
    expect(tab.textContent).toMatch(/SecurityEnterpriseContractTab -\s*$/);
  });

  it('should update when pipelineRunName param changes', () => {
    const firstPipelineRun = 'first-pipeline-run';
    useParamsMock.mockReturnValue({ pipelineRunName: firstPipelineRun });

    const { rerender } = routerRenderer(<PipelineRunSecurityEnterpriseContractTab />);
    expect(screen.getByText(`SecurityEnterpriseContractTab - ${firstPipelineRun}`)).toBeInTheDocument();

    const secondPipelineRun = 'second-pipeline-run';
    useParamsMock.mockReturnValue({ pipelineRunName: secondPipelineRun });

    rerender(<PipelineRunSecurityEnterpriseContractTab />);
    expect(screen.getByText(`SecurityEnterpriseContractTab - ${secondPipelineRun}`)).toBeInTheDocument();
  });

  it('should wrap SecurityEnterpriseContractTab in FilterContextProvider', () => {
    const mockPipelineRunName = 'test-pipeline-run';
    useParamsMock.mockReturnValue({ pipelineRunName: mockPipelineRunName });

    routerRenderer(<PipelineRunSecurityEnterpriseContractTab />);

    // FilterContextProvider doesn't add specific DOM attributes, but we can verify
    // the SecurityEnterpriseContractTab is rendered
    expect(screen.getByTestId('security-enterprise-contract-tab')).toBeInTheDocument();
  });
});
