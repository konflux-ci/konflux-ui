import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { MockIntegrationTestsWithGit } from '~/components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import { IntegrationTestScenarioKind } from '~/types/coreBuildService';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { createUseParamsMock, routerRenderer } from '~/unit-test-utils/mock-react-router';
import IntegrationTestEditFormByGroup from '../IntegrationTestEditFormByGroup';

jest.mock('../IntegrationTestViewByGroup', () => ({
  __esModule: true,
  default: jest.fn(({ integrationTest }) => (
    <div data-test="integration-test-view-by-group">
      IntegrationTestViewByGroup - {integrationTest?.metadata?.name || 'no-test'}
    </div>
  )),
}));

const mockIntegrationTest: IntegrationTestScenarioKind = {
  ...MockIntegrationTestsWithGit[0],
  spec: {
    ...MockIntegrationTestsWithGit[0].spec,
    componentGroup: 'test-group',
  },
};

const mockUseIntegrationTestScenarioV2 = jest.fn();

jest.mock('~/hooks/useIntegrationTestScenariosV2', () => ({
  useIntegrationTestScenarioV2: (...args: unknown[]) => mockUseIntegrationTestScenarioV2(...args),
}));

describe('IntegrationTestEditFormByGroup', () => {
  const mockNamespace = 'test-namespace';
  const mockGroupName = 'test-group';
  const mockIntegrationTestName = 'group-test-1';

  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);
  const useParamsMock = createUseParamsMock();

  beforeEach(() => {
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue(mockNamespace);
    useParamsMock.mockReturnValue({
      groupName: mockGroupName,
      integrationTestName: mockIntegrationTestName,
    });
  });

  it('should render spinner when loading integration test data', () => {
    mockUseIntegrationTestScenarioV2.mockReturnValue([null, false, undefined]);

    routerRenderer(<IntegrationTestEditFormByGroup />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('integration-test-view-by-group')).not.toBeInTheDocument();
  });

  it('should call useIntegrationTestScenarioV2 with correct parameters', () => {
    mockUseIntegrationTestScenarioV2.mockReturnValue([mockIntegrationTest, true, undefined]);

    routerRenderer(<IntegrationTestEditFormByGroup />);

    expect(mockUseIntegrationTestScenarioV2).toHaveBeenCalledWith(
      mockNamespace,
      mockGroupName,
      mockIntegrationTestName,
    );
  });

  it('should render IntegrationTestViewByGroup when data is loaded', () => {
    mockUseIntegrationTestScenarioV2.mockReturnValue([mockIntegrationTest, true, undefined]);

    routerRenderer(<IntegrationTestEditFormByGroup />);

    expect(screen.getByTestId('integration-test-view-by-group')).toBeInTheDocument();
    expect(
      screen.getByText(`IntegrationTestViewByGroup - ${mockIntegrationTest.metadata.name}`),
    ).toBeInTheDocument();
  });

  it('should render error state when integration test fails to load', () => {
    const mockError = { message: 'Integration test not found', code: 404 };
    mockUseIntegrationTestScenarioV2.mockReturnValue([null, true, mockError]);

    routerRenderer(<IntegrationTestEditFormByGroup />);

    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
    expect(screen.queryByTestId('integration-test-view-by-group')).not.toBeInTheDocument();
  });

  it('should render error state for server errors', () => {
    const mockError = { message: 'Server error', code: 500 };
    mockUseIntegrationTestScenarioV2.mockReturnValue([null, true, mockError]);

    routerRenderer(<IntegrationTestEditFormByGroup />);

    expect(screen.getByText(/Server error/i)).toBeInTheDocument();
    expect(screen.queryByTestId('integration-test-view-by-group')).not.toBeInTheDocument();
  });

  it('should not render spinner when data is loaded', () => {
    mockUseIntegrationTestScenarioV2.mockReturnValue([mockIntegrationTest, true, undefined]);

    routerRenderer(<IntegrationTestEditFormByGroup />);

    expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
  });

  it('should update when integration test name param changes', () => {
    mockUseIntegrationTestScenarioV2.mockReturnValue([mockIntegrationTest, true, undefined]);

    const { rerender } = routerRenderer(<IntegrationTestEditFormByGroup />);

    expect(mockUseIntegrationTestScenarioV2).toHaveBeenCalledWith(
      mockNamespace,
      mockGroupName,
      mockIntegrationTestName,
    );

    const newTestName = 'different-test';
    useParamsMock.mockReturnValue({
      groupName: mockGroupName,
      integrationTestName: newTestName,
    });

    rerender(<IntegrationTestEditFormByGroup />);

    expect(mockUseIntegrationTestScenarioV2).toHaveBeenCalledWith(
      mockNamespace,
      mockGroupName,
      newTestName,
    );
  });
});
