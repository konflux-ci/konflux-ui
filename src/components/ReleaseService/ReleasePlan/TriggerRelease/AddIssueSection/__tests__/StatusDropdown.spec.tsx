import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { formikRenderer } from '../../../../../../utils/test-utils';
import StatusDropdown from '../StatusDropdown';

describe('StatusDropdown', () => {
  beforeEach(() => {});

  it('should show dropdown options', async () => {
    formikRenderer(<StatusDropdown name="status" />);
    await act(() => fireEvent.click(screen.getByRole('button')));
    expect(screen.getByRole('menuitem', { name: 'Resolved' })).toBeVisible();
    expect(screen.getByRole('menuitem', { name: 'Unresolved' })).toBeVisible();
  });

  it('should change the status dropdown value', async () => {
    formikRenderer(<StatusDropdown name="status" />, {
      targets: { application: 'app' },
    });
    expect(screen.queryByRole('button')).toBeInTheDocument();

    await act(() => fireEvent.click(screen.getByRole('button')));

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
      screen.getByText('Unresolved');
    });
    await act(() => fireEvent.click(screen.getByText('Unresolved')));
    await waitFor(() => {
      expect(screen.getByText('Unresolved'));
    });
  });
});
