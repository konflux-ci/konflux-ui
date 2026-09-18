import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MockIntegrationTestsWithGit } from '~/components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import { useIntegrationTestScenario } from '~/hooks/useIntegrationTestScenarios';
import { useModalLauncher } from '~/shared/components/modal/ModalProvider';
import { createUseParamsMock, mockUseNamespaceHook, routerRenderer } from '~/unit-test-utils';
import { IntegrationTestOverviewTabByApplication } from '../IntegrationTestOverviewTabByApplication';

jest.mock('~/hooks/useIntegrationTestScenarios', () => ({
  useIntegrationTestScenario: jest.fn(),
}));

jest.mock('~/shared/components/modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(),
}));

const useIntegrationTestScenarioMock = useIntegrationTestScenario as jest.Mock;
const useModalLauncherMock = useModalLauncher as jest.Mock;
const useParamsMock = createUseParamsMock();
mockUseNamespaceHook('test-ns');

describe('IntegrationTestOverviewTabByApplication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useModalLauncherMock.mockReturnValue(jest.fn());
    useParamsMock.mockReturnValue({
      applicationName: 'test-app',
      integrationTestName: 'test-app-test-1',
    });
    useIntegrationTestScenarioMock.mockReturnValue([
      MockIntegrationTestsWithGit[0],
      true,
      undefined,
    ]);
  });

  it('should fetch the integration test for the application from the route', () => {
    routerRenderer(<IntegrationTestOverviewTabByApplication />);
    expect(useIntegrationTestScenarioMock).toHaveBeenCalledWith(
      'test-ns',
      'test-app',
      'test-app-test-1',
    );
  });

  it('should render the application context link', () => {
    routerRenderer(<IntegrationTestOverviewTabByApplication />);
    screen.getByText('test-app-test-1');
    screen.getByText('Application');
    expect(screen.getByRole('link', { name: 'test-app' })).toHaveAttribute(
      'href',
      '/ns/test-ns/applications/test-app',
    );
  });

  it('should show error state when the test cannot be loaded', () => {
    useIntegrationTestScenarioMock.mockReturnValue([null, true, { code: 404 }]);
    routerRenderer(<IntegrationTestOverviewTabByApplication />);
    screen.getByText('404: Page not found');
  });
});
