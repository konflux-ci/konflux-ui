import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockIntegrationTestsWithGit } from '~/components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { useAccessReviewForModel } from '~/utils/rbac';
import IntegrationTestDetailsView from '../IntegrationTestDetailsView';

jest.mock('~/utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(() => [true, true]),
}));

const useAccessReviewMock = useAccessReviewForModel as jest.Mock;

const mockIntegrationTest = MockIntegrationTestsWithGit[0];

const defaultProps = {
  integrationTest: mockIntegrationTest,
  loaded: true,
  error: undefined,
  breadcrumbs: [
    { name: 'Integration tests', path: '/tests' },
    { name: 'test-app-test-1', path: '/tests/test-app-test-1' },
  ],
  editPath: '/tests/test-app-test-1/edit',
  listPath: '/tests',
};

describe('IntegrationTestDetailsView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAccessReviewMock.mockReturnValue([true, true]);
  });

  it('should render spinner if test data is not loaded', () => {
    renderWithQueryClientAndRouter(
      <IntegrationTestDetailsView
        integrationTest={undefined}
        loaded={false}
        error={undefined}
        breadcrumbs={[]}
        editPath="/edit"
        listPath="/tests"
      />,
    );
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should show error state if test cannot be loaded', () => {
    renderWithQueryClientAndRouter(
      <IntegrationTestDetailsView
        integrationTest={null}
        loaded
        error={{ message: 'Integration test does not exist', code: 404 }}
        breadcrumbs={[]}
        editPath="/edit"
        listPath="/tests"
      />,
    );
    screen.getByText('404: Page not found');
  });

  it('should show error state if test data is undefined once loaded', () => {
    renderWithQueryClientAndRouter(
      <IntegrationTestDetailsView
        integrationTest={undefined}
        loaded
        error={{ code: 404 }}
        breadcrumbs={[]}
        editPath="/edit"
        listPath="/tests"
      />,
    );
    screen.getByText('404: Page not found');
  });

  it('should display test data when loaded', () => {
    renderWithQueryClientAndRouter(<IntegrationTestDetailsView {...defaultProps} />);
    expect(screen.getByTestId('test-name')).toHaveTextContent('test-app-test-1');
    screen.getByText('Overview');
    screen.getByText('Pipeline runs');
  });

  it('should render breadcrumbs', () => {
    renderWithQueryClientAndRouter(<IntegrationTestDetailsView {...defaultProps} />);
    screen.getByText('Integration tests');
  });

  it('should render edit link with the provided edit path', async () => {
    const user = userEvent.setup();
    renderWithQueryClientAndRouter(<IntegrationTestDetailsView {...defaultProps} />);
    await user.click(screen.getByTestId('details__actions'));
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute(
      'href',
      '/tests/test-app-test-1/edit',
    );
  });

  it('should disable edit and delete actions without RBAC permissions', async () => {
    const user = userEvent.setup();
    useAccessReviewMock.mockReturnValue([false, true]);
    renderWithQueryClientAndRouter(<IntegrationTestDetailsView {...defaultProps} />);
    await user.click(screen.getByTestId('details__actions'));
    // Without permissions the actions render as aria-disabled dropdown items.
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute('aria-disabled', 'true');
    expect(useAccessReviewMock).toHaveBeenCalledTimes(2);
  });
});
