import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { MockIntegrationTestsWithGit } from '~/components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createUseParamsMock, routerRenderer } from '~/unit-test-utils/mock-react-router';
import IntegrationTestEditFormByApplication from '../IntegrationTestEditFormByApplication';

jest.mock('../IntegrationTestViewByApplication', () => ({
  __esModule: true,
  default: jest.fn(({ integrationTest }) => (
    <div data-test="integration-test-view-by-application">
      IntegrationTestViewByApplication - {integrationTest?.metadata?.name || 'no-test'}
    </div>
  )),
}));

const mockIntegrationTest: IntegrationTestScenarioKind = MockIntegrationTestsWithGit[0];

const mockUseIntegrationTestScenario = jest.fn();

jest.mock('~/hooks/useIntegrationTestScenarios', () => ({
  useIntegrationTestScenario: (...args: unknown[]) => mockUseIntegrationTestScenario(...args),
}));

describe('IntegrationTestEditFormByApplication', () => {
  const mockNamespace = 'test-namespace';
  const mockApplicationName = 'test-app';
  const mockIntegrationTestName = 'test-app-test-1';

  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);
  const useParamsMock = createUseParamsMock();

  beforeEach(() => {
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue(mockNamespace);
    useParamsMock.mockReturnValue({
      applicationName: mockApplicationName,
      integrationTestName: mockIntegrationTestName,
    });
  });

  it('should render spinner when loading integration test data', () => {
    mockUseIntegrationTestScenario.mockReturnValue([null, false, undefined]);

    routerRenderer(<IntegrationTestEditFormByApplication />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('integration-test-view-by-application')).not.toBeInTheDocument();
  });

  it('should call useIntegrationTestScenario with correct parameters', () => {
    mockUseIntegrationTestScenario.mockReturnValue([mockIntegrationTest, true, undefined]);

    routerRenderer(<IntegrationTestEditFormByApplication />);

    expect(mockUseIntegrationTestScenario).toHaveBeenCalledWith(
      mockNamespace,
      mockApplicationName,
      mockIntegrationTestName,
    );
  });

  it('should render IntegrationTestViewByApplication when data is loaded', () => {
    mockUseIntegrationTestScenario.mockReturnValue([mockIntegrationTest, true, undefined]);

    routerRenderer(<IntegrationTestEditFormByApplication />);

    expect(screen.getByTestId('integration-test-view-by-application')).toBeInTheDocument();
    expect(
      screen.getByText(`IntegrationTestViewByApplication - ${mockIntegrationTest.metadata.name}`),
    ).toBeInTheDocument();
  });

  it('should render error state when integration test fails to load', () => {
    const mockError = { message: 'Integration test not found', code: 404 };
    mockUseIntegrationTestScenario.mockReturnValue([null, true, mockError]);

    routerRenderer(<IntegrationTestEditFormByApplication />);

    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
    expect(screen.queryByTestId('integration-test-view-by-application')).not.toBeInTheDocument();
  });

  it('should render error state for server errors', () => {
    const mockError = { message: 'Server error', code: 500 };
    mockUseIntegrationTestScenario.mockReturnValue([null, true, mockError]);

    routerRenderer(<IntegrationTestEditFormByApplication />);

    expect(screen.getByText(/Server error/i)).toBeInTheDocument();
    expect(screen.queryByTestId('integration-test-view-by-application')).not.toBeInTheDocument();
  });

  it('should not render spinner when data is loaded', () => {
    mockUseIntegrationTestScenario.mockReturnValue([mockIntegrationTest, true, undefined]);

    routerRenderer(<IntegrationTestEditFormByApplication />);

    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });

  it('should update when integration test name param changes', () => {
    mockUseIntegrationTestScenario.mockReturnValue([mockIntegrationTest, true, undefined]);

    const { rerender } = routerRenderer(<IntegrationTestEditFormByApplication />);

    expect(mockUseIntegrationTestScenario).toHaveBeenCalledWith(
      mockNamespace,
      mockApplicationName,
      mockIntegrationTestName,
    );

    const newTestName = 'different-test';
    useParamsMock.mockReturnValue({
      applicationName: mockApplicationName,
      integrationTestName: newTestName,
    });

    rerender(<IntegrationTestEditFormByApplication />);

    expect(mockUseIntegrationTestScenario).toHaveBeenCalledWith(
      mockNamespace,
      mockApplicationName,
      newTestName,
    );
  });
});
