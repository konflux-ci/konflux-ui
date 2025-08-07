import { render, screen, waitFor } from '@testing-library/react';
import { mockRoleBinding } from '../../../../__data__/rolebinding-data';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import { createK8sWatchResourceMock, createReactRouterMock } from '../../../../utils/test-utils';
import EditAccessPage from '../EditAccessPage';

const mockUseNavigate = createReactRouterMock('useNavigate');
const mockUseParams = createReactRouterMock('useParams');
const watchMock = createK8sWatchResourceMock();

jest.mock('../../../../utils/rbac', () => ({
  useAccessReviewForModels: jest.fn(),
}));

// To focus on 'the edit page' check. let us mock the PageAccess
// to ignore the real acces check.
// Access check has been covered by 'user-access-actions.spec.ts'
jest.mock('../../../PageAccess/PageAccessCheck', () => ({
  __esModule: true,
  default: jest.fn(({ children }) => <>{children}</>),
}));

// UserAccessFormPage has been tested by 'UserAccessFormPage.spec.tsx'.
// To focus on 'the edit page' check, let me mock it.
jest.mock('../UserAccessFormPage', () => ({
  UserAccessFormPage: jest.fn(() => <div>Mocked User Access Form Page</div>),
}));

describe('EditAccessPage', () => {
  const mockNamespace = 'test-ns';
  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);
  const mockNavigate = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
    useNamespaceMock.mockReturnValue(mockNamespace);
  });

  it('should render spinner while data is loading', () => {
    mockUseParams.mockReturnValue({ bindingName: 'user1' });
    watchMock.mockReturnValue([undefined, false, null]);

    render(<EditAccessPage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render error state when error occurs', async () => {
    mockUseParams.mockReturnValue({ bindingName: 'user1' });
    watchMock.mockReturnValue([undefined, true, { code: 500 }]);

    render(<EditAccessPage />);

    // Wait for async error display
    await waitFor(() => {
      expect(screen.getByText('Unable to load role binding')).toBeInTheDocument();
      // Adjust error message as per your HttpError handling
      expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
    });
  });

  it('should render the form when data is loaded', async () => {
    mockUseParams.mockReturnValue({ bindingName: 'user1' });
    // Simulate loaded state with mock data
    watchMock.mockReturnValue([mockRoleBinding, true, null]);

    render(<EditAccessPage />);

    // Ensure that UserAccessFormPage is rendered when data is loaded
    await waitFor(() =>
      expect(screen.getByText('Mocked User Access Form Page')).toBeInTheDocument(),
    );
  });
});
