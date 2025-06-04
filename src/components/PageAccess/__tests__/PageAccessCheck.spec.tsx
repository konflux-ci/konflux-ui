import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ApplicationModel } from '../../../models';
import { useAccessReviewForModels } from '../../../utils/rbac';
import PageAccessCheck from '../PageAccessCheck';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
    useLocation: () => ({ pathname: '/ns/test-ns' }),
  };
});

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModels: jest.fn(),
}));

const accessReviewMock = useAccessReviewForModels as jest.Mock;

describe('PageAccessCheck', () => {
  const renderPageAccessCheck = () =>
    render(
      <PageAccessCheck accessReviewResources={[{ model: ApplicationModel, verb: 'get' }]}>
        <div data-test="page-content">Page Content</div>
      </PageAccessCheck>,
    );

  beforeEach(() => {
    accessReviewMock.mockReturnValue([true, true]);
  });

  it('should render loading spinner if the access is not loaded', () => {
    accessReviewMock.mockReturnValue([true, false]);
    renderPageAccessCheck();
    expect(screen.queryByTestId('spinner')).toBeInTheDocument();
  });

  it('should render loading spinner if the access is not loaded', () => {
    accessReviewMock.mockReturnValue([false, true]);
    renderPageAccessCheck();
    expect(screen.queryByTestId('no-access-state')).toBeInTheDocument();
  });

  it('should render the page content', () => {
    renderPageAccessCheck();
    screen.getByText('Page Content');
  });
});
