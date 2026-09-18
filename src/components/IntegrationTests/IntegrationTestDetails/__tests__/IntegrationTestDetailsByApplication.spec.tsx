import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockIntegrationTestsWithGit } from '~/components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import { useIntegrationTestScenario } from '~/hooks/useIntegrationTestScenarios';
import {
  createUseParamsMock,
  mockAccessReviewUtil,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
} from '~/unit-test-utils';
import IntegrationTestDetailsByApplication from '../IntegrationTestDetailsByApplication';

jest.mock('~/hooks/useIntegrationTestScenarios', () => ({
  useIntegrationTestScenario: jest.fn(),
}));

jest.mock('~/components/Applications/switcher/ApplicationSwitcher', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ApplicationSwitcher: () => null as any,
}));

const useIntegrationTestScenarioMock = useIntegrationTestScenario as jest.Mock;
const useParamsMock = createUseParamsMock();
mockUseNamespaceHook('test-ns');
mockAccessReviewUtil('useAccessReviewForModel', [true, true]);

describe('IntegrationTestDetailsByApplication', () => {
  beforeEach(() => {
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch the integration test for the application and test name from the route', () => {
    renderWithQueryClientAndRouter(<IntegrationTestDetailsByApplication />);
    expect(useIntegrationTestScenarioMock).toHaveBeenCalledWith(
      'test-ns',
      'test-app',
      'test-app-test-1',
    );
  });

  it('should render the test name with application breadcrumbs', () => {
    renderWithQueryClientAndRouter(<IntegrationTestDetailsByApplication />);
    expect(screen.getByTestId('test-name')).toHaveTextContent('test-app-test-1');
    screen.getByText('Applications');
    screen.getByText('Integration tests');
  });

  it('should link edit to the application integration test edit path', async () => {
    const user = userEvent.setup();
    renderWithQueryClientAndRouter(<IntegrationTestDetailsByApplication />);
    await user.click(screen.getByTestId('details__actions'));
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/ns/test-ns/applications/test-app/integrationtests/test-app-test-1/edit',
    );
  });

  it('should render spinner while loading', () => {
    useIntegrationTestScenarioMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClientAndRouter(<IntegrationTestDetailsByApplication />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should show error state when the test cannot be loaded', () => {
    useIntegrationTestScenarioMock.mockReturnValue([null, true, { code: 404 }]);
    renderWithQueryClientAndRouter(<IntegrationTestDetailsByApplication />);
    screen.getByText('404: Page not found');
  });
});
