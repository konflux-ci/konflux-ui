import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useAuth } from '~/auth/useAuth';
import { UserDropdown } from '../UserDropdown';

jest.mock('~/auth/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

describe('UserDropdown', () => {
  const signOut = jest.fn();
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
    mockUseAuth.mockReturnValue({ user: { email: 'user@example.com' }, signOut });
  });

  it('always shows the Log out item', async () => {
    render(<UserDropdown />);

    await user.click(screen.getByText('user@example.com'));

    expect(await screen.findByRole('menuitem', { name: 'Log out' })).toBeInTheDocument();
  });

  it('does not show "Copy login command"', async () => {
    render(<UserDropdown />);

    await user.click(screen.getByText('user@example.com'));

    expect(await screen.findByRole('menuitem', { name: 'Log out' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Copy login command' })).not.toBeInTheDocument();
  });

  it('calls signOut when "Log out" is clicked', async () => {
    render(<UserDropdown />);

    await user.click(screen.getByText('user@example.com'));

    await user.click(await screen.findByRole('menuitem', { name: 'Log out' }));

    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
