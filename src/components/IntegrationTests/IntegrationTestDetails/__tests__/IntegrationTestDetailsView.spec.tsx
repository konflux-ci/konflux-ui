import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockIntegrationTestsWithGit } from '~/components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import { useIntegrationTestScenarioForContext } from '~/hooks/useIntegrationTestScenarios';
import {
  createUseParamsMock,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
} from '~/unit-test-utils';
import { useAccessReviewForModel } from '~/utils/rbac';
import IntegrationTestDetailsView from '../IntegrationTestDetailsView';

jest.mock('~/hooks/useIntegrationTestScenarios', () => ({
  useIntegrationTestScenarioForContext: jest.fn(),
}));

jest.mock('~/utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

jest.mock('~/components/Applications/switcher/ApplicationSwitcher', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ApplicationSwitcher: () => null as any,
}));

const useIntegrationTestScenarioForContextMock = useIntegrationTestScenarioForContext as jest.Mock;
const useAccessReviewMock = useAccessReviewForModel as jest.Mock;
const useParamsMock = createUseParamsMock();
mockUseNamespaceHook('test-ns');

const mockAppTest = MockIntegrationTestsWithGit[0];
const mockGroupTest = {
  ...MockIntegrationTestsWithGit[0],
  metadata: { ...MockIntegrationTestsWithGit[0].metadata, name: 'group-test-1' },
};

describe('IntegrationTestDetailsView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAccessReviewMock.mockReturnValue([true, true]);
    useParamsMock.mockReturnValue({
      applicationName: 'test-app',
      integrationTestName: 'test-app-test-1',
    });
    useIntegrationTestScenarioForContextMock.mockReturnValue([mockAppTest, true, undefined]);
  });

  it('should fetch the integration test for the application and test name from the route', () => {
    renderWithQueryClientAndRouter(<IntegrationTestDetailsView />);
    expect(useIntegrationTestScenarioForContextMock).toHaveBeenCalledWith(
      'test-ns',
      'test-app-test-1',
      {
        applicationName: 'test-app',
        groupName: undefined,
      },
    );
  });

  it('should render the test name with application breadcrumbs and tabs', () => {
    renderWithQueryClientAndRouter(<IntegrationTestDetailsView />);
    expect(screen.getByTestId('test-name')).toHaveTextContent('test-app-test-1');
    screen.getByText('Applications');
    screen.getByText('Integration tests');
    screen.getByText('Overview');
    screen.getByText('Pipeline runs');
  });

  it('should link edit to the application integration test edit path', async () => {
    const user = userEvent.setup();
    renderWithQueryClientAndRouter(<IntegrationTestDetailsView />);
    await user.click(screen.getByTestId('details__actions'));
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/ns/test-ns/applications/test-app/integrationtests/test-app-test-1/edit',
    );
  });

  it('should fetch the integration test for the group and test name from the route', () => {
    useParamsMock.mockReturnValue({
      groupName: 'test-group',
      integrationTestName: 'group-test-1',
    });
    useIntegrationTestScenarioForContextMock.mockReturnValue([mockGroupTest, true, undefined]);

    renderWithQueryClientAndRouter(<IntegrationTestDetailsView />);
    expect(useIntegrationTestScenarioForContextMock).toHaveBeenCalledWith(
      'test-ns',
      'group-test-1',
      {
        applicationName: undefined,
        groupName: 'test-group',
      },
    );
  });

  it('should render the test name with group breadcrumbs and no pipeline runs tab', () => {
    useParamsMock.mockReturnValue({
      groupName: 'test-group',
      integrationTestName: 'group-test-1',
    });
    useIntegrationTestScenarioForContextMock.mockReturnValue([mockGroupTest, true, undefined]);

    renderWithQueryClientAndRouter(<IntegrationTestDetailsView />);
    expect(screen.getByTestId('test-name')).toHaveTextContent('group-test-1');
    screen.getByText('Groups');
    screen.getByText('Integration tests');
    screen.getByText('Overview');
    expect(screen.queryByText('Pipeline runs')).not.toBeInTheDocument();
  });

  it('should render spinner while loading', () => {
    useIntegrationTestScenarioForContextMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClientAndRouter(<IntegrationTestDetailsView />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should show error state when the test cannot be loaded', () => {
    useIntegrationTestScenarioForContextMock.mockReturnValue([null, true, { code: 404 }]);
    renderWithQueryClientAndRouter(<IntegrationTestDetailsView />);
    screen.getByText('404: Page not found');
  });

  it('should disable edit and delete actions without RBAC permissions', async () => {
    const user = userEvent.setup();
    useAccessReviewMock.mockReturnValue([false, true]);
    renderWithQueryClientAndRouter(<IntegrationTestDetailsView />);
    await user.click(screen.getByTestId('details__actions'));
    // Without permissions the actions render as aria-disabled dropdown items.
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute('aria-disabled', 'true');
    expect(useAccessReviewMock).toHaveBeenCalledTimes(2);
  });
});
