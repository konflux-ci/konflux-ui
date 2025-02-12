import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { formikRenderer } from '../../../../utils/test-utils';
import { UsernameSection } from '../UsernameSection';

const errorMsg =
  'Must be 2 to 45 characters long and can only contain lowercase letters from a to z, numbers from 0 to 9, underscores( _ ), hyphens( - ), or periods( . ).';

const testUsernameInput = async (inputValue: string, expectedError: string | null) => {
  await act(() =>
    fireEvent.input(screen.getByRole('searchbox'), { target: { value: inputValue } }),
  );

  if (expectedError) {
    await waitFor(() => {
      expect(screen.getByText(expectedError)).toBeVisible();
    });
  } else {
    await waitFor(() => {
      expect(screen.getByRole('list', { name: 'Chip group category' })).toBeVisible();
      expect(screen.getByText(inputValue)).toBeVisible();
    });
  }
};

describe('UsernameSection', () => {
  it('should show usernames field', () => {
    formikRenderer(<UsernameSection />, { usernames: [] });
    expect(
      screen.getByText(
        'Konflux is not currently validating usernames, so make sure that usernames you enter are accurate.',
      ),
    ).toBeVisible();
    expect(screen.getByText('Add users')).toBeVisible();
    expect(screen.getByText('Enter usernames')).toBeVisible();
    expect(screen.getByRole('searchbox')).toBeVisible();
  });

  it('should add username chip when entered', async () => {
    formikRenderer(<UsernameSection />, { usernames: [] });
    await testUsernameInput('user1', null);
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Remove user1' })));
    expect(screen.queryByText('user1')).not.toBeInTheDocument();
    await testUsernameInput('user2', null);
  });

  it('should show correct field status while entering', async () => {
    formikRenderer(<UsernameSection />, { usernames: [] });
    expect(
      screen.getByText('Provide Konflux usernames for the users you want to invite.'),
    ).toBeVisible();
    await testUsernameInput('user!@#', errorMsg);
    await testUsernameInput('myuser', null);
  });

  it('should not add username again if entry already exists', async () => {
    formikRenderer(<UsernameSection />, { usernames: [] });
    await testUsernameInput('user1', null);

    await act(() => fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'user1' } }));
    expect(screen.getAllByText('user1')).toHaveLength(1);
  });

  it('should validate username format', async () => {
    formikRenderer(<UsernameSection />, { usernames: [] });
    await testUsernameInput('user-12_.3', null);
    await testUsernameInput('user1!@#', errorMsg);
    await testUsernameInput('1', errorMsg);
    await testUsernameInput('11111111111111111111111111111111111111111111111', errorMsg);
  });
});
