import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockIntegrationTestsWithGit } from '~/components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import { useIntegrationTestScenarioV2 } from '~/hooks/useIntegrationTestScenariosV2';
import {
  createUseParamsMock,
  mockAccessReviewUtil,
  mockUseNamespaceHook,
  renderWithQueryClientAndRouter,
} from '~/unit-test-utils';
import IntegrationTestDetailsByGroup from '../IntegrationTestDetailsByGroup';

jest.mock('~/hooks/useIntegrationTestScenariosV2', () => ({
  useIntegrationTestScenarioV2: jest.fn(),
}));

const useIntegrationTestScenarioV2Mock = useIntegrationTestScenarioV2 as jest.Mock;
const useParamsMock = createUseParamsMock();
mockUseNamespaceHook('test-ns');
mockAccessReviewUtil('useAccessReviewForModel', [true, true]);

describe('IntegrationTestDetailsByGroup', () => {
  beforeEach(() => {
    useParamsMock.mockReturnValue({
      groupName: 'test-group',
      integrationTestName: 'group-test-1',
    });
    useIntegrationTestScenarioV2Mock.mockReturnValue([
      {
        ...MockIntegrationTestsWithGit[0],
        metadata: { ...MockIntegrationTestsWithGit[0].metadata, name: 'group-test-1' },
      },
      true,
      undefined,
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch the integration test for the group and test name from the route', () => {
    renderWithQueryClientAndRouter(<IntegrationTestDetailsByGroup />);
    expect(useIntegrationTestScenarioV2Mock).toHaveBeenCalledWith(
      'test-ns',
      'test-group',
      'group-test-1',
    );
  });

  it('should render the test name with group breadcrumbs', () => {
    renderWithQueryClientAndRouter(<IntegrationTestDetailsByGroup />);
    expect(screen.getByTestId('test-name')).toHaveTextContent('group-test-1');
    screen.getByText('Groups');
    screen.getByText('Integration tests');
  });

  it('should render spinner while loading', () => {
    useIntegrationTestScenarioV2Mock.mockReturnValue([null, false, undefined]);
    renderWithQueryClientAndRouter(<IntegrationTestDetailsByGroup />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should show error state when the test cannot be loaded', () => {
    useIntegrationTestScenarioV2Mock.mockReturnValue([null, true, { code: 404 }]);
    renderWithQueryClientAndRouter(<IntegrationTestDetailsByGroup />);
    screen.getByText('404: Page not found');
  });

  it('should link the edit action to the group integration test edit page', async () => {
    const user = userEvent.setup();
    renderWithQueryClientAndRouter(<IntegrationTestDetailsByGroup />);
    await user.click(screen.getByTestId('details__actions'));
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/ns/test-ns/groups/test-group/integrationtests/group-test-1/edit',
    );
  });
});
