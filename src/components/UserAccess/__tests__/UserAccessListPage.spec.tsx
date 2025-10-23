import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { FULL_APPLICATION_TITLE } from '~/consts/labels';
import { RoleBindingModel } from '~/models';
import { mockAccessReviewUtil } from '~/unit-test-utils/mock-access-review';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { routerRenderer } from '~/utils/test-utils';
import UserAccessPage from '../UserAccessListPage';

// UserAccessListView has its own tests. We mock it here to focus on
// testing UserAccessListPage's logic: page layout, actions, and permissions.
jest.mock('../UserAccessListView', () => ({
  UserAccessListView: jest.fn(() => <div>UserAccessListView</div>),
}));

describe('UserAccessListPage', () => {
  const mockNamespace = 'test-namespace';
  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);
  const accessReviewMock = mockAccessReviewUtil('useAccessReviewForModel', [true, true]);

  beforeEach(() => {
    jest.clearAllMocks();
    useNamespaceMock.mockReturnValue(mockNamespace);
    accessReviewMock.mockReturnValue([true, true]);
  });

  it('should render the page with correct title and description', () => {
    routerRenderer(<UserAccessPage />);

    expect(screen.getByText('User access')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Invite users to collaborate with you by granting them access to your namespace.',
      ),
    ).toBeInTheDocument();
  });

  it('should set the document title correctly', () => {
    routerRenderer(<UserAccessPage />);

    expect(document.title).toBe(`User access | ${FULL_APPLICATION_TITLE}`);
  });

  it('should render UserAccessListView component', () => {
    routerRenderer(<UserAccessPage />);

    expect(screen.getByText('UserAccessListView')).toBeInTheDocument();
  });

  it('should render Actions button', () => {
    routerRenderer(<UserAccessPage />);

    expect(screen.getByRole('button', { name: /actions/i })).toBeInTheDocument();
  });

  it('should check access review for RoleBindingModel with create action', () => {
    routerRenderer(<UserAccessPage />);

    expect(accessReviewMock).toHaveBeenCalledWith(RoleBindingModel, 'create');
  });

  describe('error scenarios', () => {
    it('should render page content when user lacks create permission', () => {
      accessReviewMock.mockReturnValue([false, true]);

      routerRenderer(<UserAccessPage />);

      // Page should still render with title, description, and actions button
      expect(screen.getByText('User access')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Invite users to collaborate with you by granting them access to your namespace.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /actions/i })).toBeInTheDocument();
    });

    it('should render page content when access review is loading or fails', () => {
      accessReviewMock.mockReturnValue([false, false]);

      routerRenderer(<UserAccessPage />);

      // Page should still render with all content
      expect(screen.getByText('User access')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Invite users to collaborate with you by granting them access to your namespace.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('UserAccessListView')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /actions/i })).toBeInTheDocument();
    });

    it('should update when permissions change from denied to granted', () => {
      // Start with no permission
      accessReviewMock.mockReturnValue([false, true]);

      const { rerender } = routerRenderer(<UserAccessPage />);

      expect(screen.getByRole('button', { name: /actions/i })).toBeInTheDocument();

      // Permission granted
      accessReviewMock.mockReturnValue([true, true]);

      rerender(<UserAccessPage />);

      // Actions button should still be present with updated permissions
      expect(screen.getByRole('button', { name: /actions/i })).toBeInTheDocument();
    });
  });
});
