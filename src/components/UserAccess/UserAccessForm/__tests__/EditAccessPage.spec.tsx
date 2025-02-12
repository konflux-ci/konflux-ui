import { render, screen, waitFor } from '@testing-library/react';
import { mockRoleBinding } from '../../../../__data__/rolebinding-data';
import { useRoleBindings } from '../../../../hooks/useRoleBindings';
import { createReactRouterMock, createUseWorkspaceInfoMock } from '../../../../utils/test-utils';
import EditAccessPage from '../EditAccessPage';

const mockUseNavigate = createReactRouterMock('useNavigate');
const mockUseParams = createReactRouterMock('useParams');

// We cannot enjoy "createK8sUtilMock('useK8sWatchResource')" here.
jest.mock('../../../../hooks/useRoleBindings', () => ({
  useRoleBindings: jest.fn(),
}));

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
  createUseWorkspaceInfoMock({ namespace: 'test-ns', workspace: 'test-ws' });
  const mockUseRoleBindings = useRoleBindings as jest.Mock;
  const mockNavigate = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  it('should render spinner while data is loading', () => {
    mockUseParams.mockReturnValue({ bindingName: 'user1' });
    mockUseRoleBindings.mockReturnValue([[], true, null]); // Simulate loading state

    render(<EditAccessPage />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should render error state when error occurs', async () => {
    mockUseParams.mockReturnValue({ bindingName: 'user1' });
    mockUseRoleBindings.mockReturnValue([[], false, { code: 500 }]); // Simulate error

    render(<EditAccessPage />);

    // Wait for async error display
    await waitFor(() => {
      expect(screen.getByText('Unable to load role binding user1')).toBeInTheDocument();
      // Adjust error message as per your HttpError handling
      expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
    });
  });

  it('should render the form when data is loaded', async () => {
    mockUseParams.mockReturnValue({ bindingName: 'user1' });
    // Simulate loaded state with mock data
    mockUseRoleBindings.mockReturnValue([[mockRoleBinding], false, null]);

    render(<EditAccessPage />);

    // Ensure that UserAccessFormPage is rendered when data is loaded
    await waitFor(() =>
      expect(screen.getByText('Mocked User Access Form Page')).toBeInTheDocument(),
    );
  });
});
