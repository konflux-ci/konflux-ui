import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { mockRoleBinding } from '../../../__data__/rolebinding-data';
import { createK8sUtilMock } from '../../../utils/test-utils';
import { RevokeAccessModal } from '../RevokeAccessModal';

const k8sDeleteMock = createK8sUtilMock('K8sQueryDeleteResource');

describe('RevokeAccessModal', () => {
  it('should render revoke modal', () => {
    render(
      <RevokeAccessModal rb={mockRoleBinding} username="user1" modalProps={{ isOpen: true }} />,
    );
    expect(screen.getByTestId('description').textContent).toBe(
      'The user user1 will lose access to this namespace and all of its applications, environments, and any other dependent items.',
    );
    expect(screen.getByRole('button', { name: 'Revoke' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  it('should delete resource & close modal when revoked', async () => {
    const onClose = jest.fn();
    k8sDeleteMock.mockResolvedValue({});
    render(
      <RevokeAccessModal
        rb={mockRoleBinding}
        username="user1"
        onClose={onClose}
        modalProps={{ isOpen: true }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    await waitFor(() => expect(k8sDeleteMock).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it('should show error and not close modal if deletion fails', async () => {
    const onClose = jest.fn();
    k8sDeleteMock.mockRejectedValue(new Error('Unable to delete'));
    render(
      <RevokeAccessModal
        rb={mockRoleBinding}
        username="user1"
        onClose={onClose}
        modalProps={{ isOpen: true }}
      />,
    );
    fireEvent.click(screen.getByText('Revoke'));
    await waitFor(() => expect(screen.getByText('Unable to delete')).toBeVisible());
  });
});
