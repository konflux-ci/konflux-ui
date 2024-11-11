import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createK8sUtilMock } from '../../../utils/test-utils';
import SignupButton from '../SignupButton';

const fetchMock = createK8sUtilMock('commonFetch');

describe('Signup Button', () => {
  it('should make signup call on submit', async () => {
    fetchMock.mockResolvedValue({ status: 202 });
    render(<SignupButton />);
    const signupButton = screen.getByRole('button', { name: 'Join the waitlist' });
    expect(signupButton).toBeEnabled();
    fireEvent.click(signupButton);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/registration/api/v1/signup', { method: 'POST' }),
    );
  });
});
