import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { NamespaceKind, RoleBinding } from '~/types';
import {
  createK8sUtilMock,
  createK8sWatchResourceMock,
  renderWithQueryClientAndRouter,
} from '~/unit-test-utils';
import ManageVisibilityModal from '../ManageVisibilityModal';

// Mock the K8s utilities
const mockK8sQueryCreateResource = createK8sUtilMock('K8sQueryCreateResource');
const mockK8sQueryDeleteResource = createK8sUtilMock('K8sQueryDeleteResource');
const mockUseK8sWatchResource = createK8sWatchResourceMock();

// Mock the modal launcher
const mockOnClose = jest.fn();

const mockNamespace: NamespaceKind = {
  apiVersion: 'v1',
  kind: 'Namespace',
  metadata: {
    name: 'test-namespace',
    creationTimestamp: '2023-01-01T00:00:00Z',
  },
  spec: {},
  status: {},
};

const mockPublicRoleBinding: RoleBinding = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'RoleBinding',
  metadata: {
    name: 'konflux-public-viewer',
    namespace: 'test-namespace',
  },
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'ClusterRole',
    name: 'konflux-viewer-user-actions',
  },
  subjects: [
    {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'Group',
      name: 'system:authenticated',
    },
  ],
};

const mockPrivateRoleBinding: RoleBinding = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'RoleBinding',
  metadata: {
    name: 'some-other-role',
    namespace: 'test-namespace',
  },
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'ClusterRole',
    name: 'different-role',
  },
  subjects: [
    {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'User',
      name: 'test-user',
    },
  ],
};

const renderManageVisibilityModal = () => {
  return renderWithQueryClientAndRouter(
    <ManageVisibilityModal namespace={mockNamespace} onClose={mockOnClose} />,
  );
};

describe('ManageVisibilityModal Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mocks to their default implementations
    mockK8sQueryCreateResource.mockResolvedValue({});
    mockK8sQueryDeleteResource.mockResolvedValue({});
    mockOnClose.mockImplementation(() => {});
    mockUseK8sWatchResource.mockImplementation(() => ({
      data: [],
      isLoading: false,
      error: null,
    }));
  });

  // ========== 1. useK8sWatchResource Hook Coverage ==========
  describe('useK8sWatchResource Hook Coverage', () => {
    it('should show loading state while fetching role bindings', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      renderManageVisibilityModal();

      // Form should be rendered but save button should be disabled during loading
      expect(screen.getByText('Private (Default)')).toBeInTheDocument();
      expect(screen.getByText('Public')).toBeInTheDocument();

      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('should display error when useK8sWatchResource fails', async () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: 'Failed to fetch role bindings' },
      });

      renderManageVisibilityModal();

      // Error alert should be displayed
      await waitFor(() => {
        expect(
          screen.getByText(
            'Failed to load current visibility state: Failed to fetch role bindings',
          ),
        ).toBeInTheDocument();
      });

      // Form fields should be disabled when there's an error
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();

      const radioButtons = screen.getAllByRole('radio');
      radioButtons.forEach((radio) => {
        expect(radio).toBeDisabled();
      });
    });

    it('should handle error without message property', async () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: 'String error without message property',
      });

      renderManageVisibilityModal();

      // Error alert should be displayed with string conversion
      await waitFor(() => {
        expect(
          screen.getByText(
            'Failed to load current visibility state: String error without message property',
          ),
        ).toBeInTheDocument();
      });

      // Form fields should be disabled when there's an error
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();

      const radioButtons = screen.getAllByRole('radio');
      radioButtons.forEach((radio) => {
        expect(radio).toBeDisabled();
      });
    });

    it('should detect private namespace when no role bindings exist', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderManageVisibilityModal();

      // Private should be selected by default
      const privateRadio = screen.getByRole('radio', { name: /private/i });
      expect(privateRadio).toBeChecked();

      // Save button should be disabled (no changes)
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('should detect public namespace when public role binding exists', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPublicRoleBinding],
        isLoading: false,
        error: null,
      });

      renderManageVisibilityModal();

      // Public should be selected
      const publicRadio = screen.getByRole('radio', { name: /public/i });
      expect(publicRadio).toBeChecked();

      // Save button should be disabled (no changes)
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('should handle role binding without subjects array', () => {
      const roleBindingWithoutSubjects = {
        ...mockPublicRoleBinding,
        subjects: undefined,
      };

      mockUseK8sWatchResource.mockReturnValue({
        data: [roleBindingWithoutSubjects],
        isLoading: false,
        error: null,
      });

      renderManageVisibilityModal();

      // Should default to private when subjects are missing
      const privateRadio = screen.getByRole('radio', { name: /private/i });
      expect(privateRadio).toBeChecked();
    });

    it('should handle role binding with empty subjects array', () => {
      const roleBindingWithEmptySubjects = {
        ...mockPublicRoleBinding,
        subjects: [],
      };

      mockUseK8sWatchResource.mockReturnValue({
        data: [roleBindingWithEmptySubjects],
        isLoading: false,
        error: null,
      });

      renderManageVisibilityModal();

      // Should default to private when subjects array is empty
      const privateRadio = screen.getByRole('radio', { name: /private/i });
      expect(privateRadio).toBeChecked();
    });

    it("should ignore role bindings that don't match expected pattern", () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPrivateRoleBinding], // Different role binding
        isLoading: false,
        error: null,
      });

      renderManageVisibilityModal();

      // Should default to private when no matching role binding is found
      const privateRadio = screen.getByRole('radio', { name: /private/i });
      expect(privateRadio).toBeChecked();
    });

    it('should handle multiple role bindings and find the correct one', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPrivateRoleBinding, mockPublicRoleBinding],
        isLoading: false,
        error: null,
      });

      renderManageVisibilityModal();

      // Should find the public role binding among multiple bindings
      const publicRadio = screen.getByRole('radio', { name: /public/i });
      expect(publicRadio).toBeChecked();
    });
  });

  // ========== 2. Form Behavior Coverage ==========
  describe('Form Behavior Coverage', () => {
    it('should initialize form with current visibility state (private)', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      renderManageVisibilityModal();

      const privateRadio = screen.getByRole('radio', { name: /private/i });
      expect(privateRadio).toBeChecked();
    });

    it('should initialize form with current visibility state (public)', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPublicRoleBinding],
        isLoading: false,
        error: null,
      });

      renderManageVisibilityModal();

      const publicRadio = screen.getByRole('radio', { name: /public/i });
      expect(publicRadio).toBeChecked();
    });

    it('should detect changes when visibility selection changes', async () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [], // Start with private
        isLoading: false,
        error: null,
      });

      renderManageVisibilityModal();

      // Save button should be disabled initially (no changes)
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();

      // Change to public
      const publicRadio = screen.getByRole('radio', { name: /public/i });
      await userEvent.click(publicRadio);

      // Save button should be enabled after change
      expect(saveButton).not.toBeDisabled();
    });

    it('should disable save button when no changes are made', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPublicRoleBinding],
        isLoading: false,
        error: null,
      });

      renderManageVisibilityModal();

      // Save button should be disabled when form matches current state
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when changes are made', async () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPublicRoleBinding], // Start with public
        isLoading: false,
        error: null,
      });

      renderManageVisibilityModal();

      // Change to private
      const privateRadio = screen.getByRole('radio', { name: /private/i });
      await userEvent.click(privateRadio);

      // Save button should be enabled after change
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('should disable form elements during submission', async () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      // Mock slow API call to test loading state
      let resolvePromise: (value: unknown) => void;
      mockK8sQueryCreateResource.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          }),
      );

      renderManageVisibilityModal();

      // Change to public and submit
      const publicRadio = screen.getByRole('radio', { name: /public/i });
      await userEvent.click(publicRadio);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(saveButton);

      // Save button should be disabled and show loading state during submission
      await waitFor(() => {
        expect(saveButton).toBeDisabled();
        expect(saveButton).toHaveAttribute('aria-disabled', 'true');
      });

      // Cancel button should also be disabled during submission
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();

      // Resolve the promise to complete the test
      resolvePromise({});
    });

    it('should show loading spinner on save button during submission', async () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      // Mock slow API call
      mockK8sQueryCreateResource.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      renderManageVisibilityModal();

      // Change to public and submit
      const publicRadio = screen.getByRole('radio', { name: /public/i });
      await userEvent.click(publicRadio);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(saveButton);

      // Button should show loading state
      await waitFor(() => {
        expect(saveButton).toHaveAttribute('aria-disabled', 'true');
      });
    });

    it('should handle cancel button click', async () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      // Create a fresh mock for this test to avoid interference
      const freshMockOnClose = jest.fn();

      renderWithQueryClientAndRouter(
        <ManageVisibilityModal namespace={mockNamespace} onClose={freshMockOnClose} />,
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      expect(freshMockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  // ========== 3. handleSubmit Function Coverage ==========
  describe('handleSubmit Function Coverage', () => {
    describe('Create Role Binding Test (Isolated)', () => {
      let isolatedMockOnCloseCreate: jest.Mock;

      beforeEach(() => {
        // Create completely fresh mock just for this test
        isolatedMockOnCloseCreate = jest.fn();
      });

      it('should create role binding when switching to public', async () => {
        mockUseK8sWatchResource.mockReturnValue({
          data: [], // Start with private
          isLoading: false,
          error: null,
        });

        // Use the isolated mock
        renderWithQueryClientAndRouter(
          <ManageVisibilityModal namespace={mockNamespace} onClose={isolatedMockOnCloseCreate} />,
        );

        // Change to public and submit
        const publicRadio = screen.getByRole('radio', { name: /public/i });
        await userEvent.click(publicRadio);

        const saveButton = screen.getByRole('button', { name: /save/i });
        await userEvent.click(saveButton);

        // Should call create resource with correct parameters
        await waitFor(() => {
          expect(mockK8sQueryCreateResource).toHaveBeenCalledWith({
            model: expect.objectContaining({
              kind: 'RoleBinding',
              plural: 'rolebindings',
              apiGroup: 'rbac.authorization.k8s.io',
            }),
            resource: {
              apiVersion: 'rbac.authorization.k8s.io/v1',
              kind: 'RoleBinding',
              metadata: {
                name: 'konflux-public-viewer',
                namespace: 'test-namespace',
              },
              roleRef: {
                apiGroup: 'rbac.authorization.k8s.io',
                kind: 'ClusterRole',
                name: 'konflux-viewer-user-actions',
              },
              subjects: [
                {
                  apiGroup: 'rbac.authorization.k8s.io',
                  kind: 'Group',
                  name: 'system:authenticated',
                },
              ],
            },
            queryOptions: {
              ns: 'test-namespace',
            },
          });
        });

        expect(isolatedMockOnCloseCreate).toHaveBeenCalledTimes(1);
      });
    });

    describe('Delete Role Binding Test (Isolated)', () => {
      let isolatedMockOnClose: jest.Mock;

      beforeEach(() => {
        // Create completely fresh mock just for this test
        isolatedMockOnClose = jest.fn();
      });

      it('should delete role binding when switching to private', async () => {
        mockUseK8sWatchResource.mockReturnValue({
          data: [mockPublicRoleBinding], // Start with public
          isLoading: false,
          error: null,
        });

        // Use the isolated mock
        renderWithQueryClientAndRouter(
          <ManageVisibilityModal namespace={mockNamespace} onClose={isolatedMockOnClose} />,
        );

        // Change to private and submit
        const privateRadio = screen.getByRole('radio', { name: /private/i });
        await userEvent.click(privateRadio);

        const saveButton = screen.getByRole('button', { name: /save/i });
        await userEvent.click(saveButton);

        // Should call delete resource with correct parameters
        await waitFor(() => {
          expect(mockK8sQueryDeleteResource).toHaveBeenCalledWith({
            model: expect.objectContaining({
              kind: 'RoleBinding',
              plural: 'rolebindings',
              apiGroup: 'rbac.authorization.k8s.io',
            }),
            queryOptions: {
              name: 'konflux-public-viewer',
              ns: 'test-namespace',
            },
          });
        });

        expect(isolatedMockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should disable save button when namespace is already private', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPrivateRoleBinding], // No public role binding - already private
        isLoading: false,
        error: null,
      });

      renderManageVisibilityModal();

      // Private radio should be selected (already private)
      const privateRadio = screen.getByRole('radio', { name: /private/i });
      expect(privateRadio).toBeChecked();

      // Save button should be disabled since no changes are made
      const saveButton = screen.getByRole('button', { name: /save/i });
      expect(saveButton).toBeDisabled();

      // Should not call delete resource since no changes are made
      expect(mockK8sQueryDeleteResource).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    describe('Close Modal Test (Isolated)', () => {
      let isolatedMockOnCloseSuccess: jest.Mock;

      beforeEach(() => {
        // Create completely fresh mock just for this test
        isolatedMockOnCloseSuccess = jest.fn();
      });

      it('should close modal on successful submission', async () => {
        mockUseK8sWatchResource.mockReturnValue({
          data: [],
          isLoading: false,
          error: null,
        });

        // Use the isolated mock
        renderWithQueryClientAndRouter(
          <ManageVisibilityModal namespace={mockNamespace} onClose={isolatedMockOnCloseSuccess} />,
        );

        // Change to public and submit
        const publicRadio = screen.getByRole('radio', { name: /public/i });
        await userEvent.click(publicRadio);

        const saveButton = screen.getByRole('button', { name: /save/i });
        await userEvent.click(saveButton);

        await waitFor(() => {
          expect(isolatedMockOnCloseSuccess).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  // ========== 4. Error Handling Coverage ==========
  describe('Error Handling Coverage', () => {
    it('should handle error during role binding creation', async () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockK8sQueryCreateResource.mockRejectedValue(new Error('Create failed'));

      renderManageVisibilityModal();

      // Change to public and submit
      const publicRadio = screen.getByRole('radio', { name: /public/i });
      await userEvent.click(publicRadio);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(saveButton);

      // Should display error message
      await waitFor(() => {
        expect(
          screen.getByText('Failed to save visibility setting: Create failed'),
        ).toBeInTheDocument();
      });

      // Modal should not close on error
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should handle error during role binding deletion', async () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [mockPublicRoleBinding],
        isLoading: false,
        error: null,
      });

      mockK8sQueryDeleteResource.mockRejectedValue(new Error('Delete failed'));

      renderManageVisibilityModal();

      // Change to private and submit
      const privateRadio = screen.getByRole('radio', { name: /private/i });
      await userEvent.click(privateRadio);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(saveButton);

      // Should display error message
      await waitFor(() => {
        expect(
          screen.getByText('Failed to save visibility setting: Delete failed'),
        ).toBeInTheDocument();
      });

      // Modal should not close on error
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should handle error without message property', async () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockK8sQueryCreateResource.mockRejectedValue('String error');

      renderManageVisibilityModal();

      // Change to public and submit
      const publicRadio = screen.getByRole('radio', { name: /public/i });
      await userEvent.click(publicRadio);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(saveButton);

      // Should display error message with string conversion
      await waitFor(() => {
        expect(
          screen.getByText('Failed to save visibility setting: String error'),
        ).toBeInTheDocument();
      });
    });

    it('should clear error when starting new submission', async () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      // First submission fails
      mockK8sQueryCreateResource.mockRejectedValueOnce(new Error('First error'));

      renderManageVisibilityModal();

      // Change to public and submit
      const publicRadio = screen.getByRole('radio', { name: /public/i });
      await userEvent.click(publicRadio);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(saveButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(
          screen.getByText('Failed to save visibility setting: First error'),
        ).toBeInTheDocument();
      });

      // Mock successful second submission
      mockK8sQueryCreateResource.mockResolvedValueOnce({});

      // Submit again
      await userEvent.click(saveButton);

      // Error should be cleared during new submission
      await waitFor(() => {
        expect(
          screen.queryByText('Failed to save visibility setting: First error'),
        ).not.toBeInTheDocument();
      });
    });

    it('should display error alert when error exists', () => {
      mockUseK8sWatchResource.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { message: 'Test error' },
      });

      renderManageVisibilityModal();

      // Error alert should be displayed
      expect(
        screen.getByText('Failed to load current visibility state: Test error'),
      ).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });
});
