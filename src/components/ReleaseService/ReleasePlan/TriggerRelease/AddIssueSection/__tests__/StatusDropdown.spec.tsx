import { screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { formikRenderer } from '../../../../../../utils/test-utils';
import StatusDropdown from '../StatusDropdown';

describe('StatusDropdown', () => {
  const user = userEvent.setup();
  beforeEach(() => {});

  it('should show dropdown options', async () => {
    formikRenderer(<StatusDropdown name="status" />);
    await user.click(screen.getByText('Select status of isssue'));
    expect(screen.getByRole('menuitem', { name: 'Resolved' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'Unresolved' })).toBeVisible();
  });

  it('should change the status dropdown value', async () => {
    formikRenderer(<StatusDropdown name="status" />, {
      targets: { application: 'app' },
    });
    await user.click(screen.getByText('Select status of isssue'));
    await user.click(screen.getByText('Unresolved'));
    await waitFor(() => {
      expect(screen.getByTestId('dropdown-toggle').textContent).toEqual('Unresolved');
    });
  });
});
