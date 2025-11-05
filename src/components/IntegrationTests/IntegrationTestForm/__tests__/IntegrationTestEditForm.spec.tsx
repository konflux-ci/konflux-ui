import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { MockIntegrationTestsWithGit } from '~/components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createUseParamsMock, routerRenderer } from '~/unit-test-utils/mock-react-router';
import { IntegrationTestEditForm } from '../IntegrationTestEditForm';

// IntegrationTestView has its own tests. We mock it here to focus on
// testing IntegrationTestEditForm's specific logic: loading integration test data,
// handling loading and error states, and passing the loaded data to IntegrationTestView.
jest.mock('../IntegrationTestView', () => ({
  __esModule: true,
  default: jest.fn(({ applicationName, integrationTest }) => (
    <div data-test="integration-test-view">
      IntegrationTestView - {applicationName} - {integrationTest?.metadata?.name || 'no-test'}
    </div>
  )),
}));

const mockIntegrationTest: IntegrationTestScenarioKind = MockIntegrationTestsWithGit[0];

const mockUseIntegrationTestScenario = jest.fn();

jest.mock('../../../../hooks/useIntegrationTestScenarios', () => ({
  useIntegrationTestScenario: (...args: unknown[]) => mockUseIntegrationTestScenario(...args),
}));

describe('IntegrationTestEditForm', () => {
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

    routerRenderer(<IntegrationTestEditForm />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('integration-test-view')).not.toBeInTheDocument();
  });

  it('should call useIntegrationTestScenario with correct parameters', () => {
    mockUseIntegrationTestScenario.mockReturnValue([mockIntegrationTest, true, undefined]);

    routerRenderer(<IntegrationTestEditForm />);

    expect(mockUseIntegrationTestScenario).toHaveBeenCalledWith(
      mockNamespace,
      mockApplicationName,
      mockIntegrationTestName,
    );
  });

  it('should render IntegrationTestView when data is loaded', () => {
    mockUseIntegrationTestScenario.mockReturnValue([mockIntegrationTest, true, undefined]);

    routerRenderer(<IntegrationTestEditForm />);

    expect(screen.getByTestId('integration-test-view')).toBeInTheDocument();
    expect(
      screen.getByText(
        `IntegrationTestView - ${mockApplicationName} - ${mockIntegrationTest.metadata.name}`,
      ),
    ).toBeInTheDocument();
  });

  it('should render error state when integration test fails to load', () => {
    const mockError = { message: 'Integration test not found', code: 404 };
    mockUseIntegrationTestScenario.mockReturnValue([null, true, mockError]);

    routerRenderer(<IntegrationTestEditForm />);

    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
    expect(screen.queryByTestId('integration-test-view')).not.toBeInTheDocument();
  });

  it('should render error state for server errors', () => {
    const mockError = { message: 'Server error', code: 500 };
    mockUseIntegrationTestScenario.mockReturnValue([null, true, mockError]);

    routerRenderer(<IntegrationTestEditForm />);

    expect(screen.getByText(/Server error/i)).toBeInTheDocument();
    expect(screen.queryByTestId('integration-test-view')).not.toBeInTheDocument();
  });

  it('should not render spinner when data is loaded', () => {
    mockUseIntegrationTestScenario.mockReturnValue([mockIntegrationTest, true, undefined]);

    routerRenderer(<IntegrationTestEditForm />);

    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });

  it('should update when integration test name param changes', () => {
    mockUseIntegrationTestScenario.mockReturnValue([mockIntegrationTest, true, undefined]);

    const { rerender } = routerRenderer(<IntegrationTestEditForm />);

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

    rerender(<IntegrationTestEditForm />);

    expect(mockUseIntegrationTestScenario).toHaveBeenCalledWith(
      mockNamespace,
      mockApplicationName,
      newTestName,
    );
  });
});
