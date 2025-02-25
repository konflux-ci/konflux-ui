import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { formikRenderer } from '../../../../utils/test-utils';
import { KONFLUX_USERNAME_REGEX_MGS } from '../../../../utils/validation-utils';
import { UsernameSection } from '../UsernameSection';

const testValidUsernameInput = async (inputValue: string) => {
  act(() => {
    const inputElement = screen.getByRole('searchbox');
    fireEvent.change(inputElement, { target: { value: inputValue } });
    fireEvent.keyDown(inputElement, { key: 'Enter', code: 'Enter', charCode: 13 });
  });

  await waitFor(() => {
    expect(screen.getByRole('list', { name: 'Chip group category' })).toBeVisible();
    expect(screen.getByText(inputValue)).toBeVisible();
  });
};

const testInvalidUsernameInput = async (inputValue: string, expectedError: string | null) => {
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
    await testValidUsernameInput('user1');
    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Remove user1' })));
    expect(screen.queryByText('user1')).not.toBeInTheDocument();
    await testValidUsernameInput('user2');
  });

  it('should show correct field status while entering', async () => {
    formikRenderer(<UsernameSection />, { usernames: [] });
    expect(
      screen.getByText('Provide Konflux usernames for the users you want to invite.'),
    ).toBeVisible();
    await testInvalidUsernameInput('user!@#', 'Username not validated');
    await testValidUsernameInput('myuser');
  });

  it('should not add username again if entry already exists', async () => {
    formikRenderer(<UsernameSection />, { usernames: [] });
    await testValidUsernameInput('user1');

    const inputElement = screen.getByRole('searchbox');
    fireEvent.change(inputElement, { target: { value: 'user1' } });
    fireEvent.keyDown(inputElement, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(screen.getAllByText('user1')).toHaveLength(1);
  });

  it('should validate username format', async () => {
    formikRenderer(<UsernameSection />, { usernames: [] });
    await testValidUsernameInput('user-12_@3');
    await testInvalidUsernameInput('user1!@#', KONFLUX_USERNAME_REGEX_MGS);
    await testInvalidUsernameInput('1', KONFLUX_USERNAME_REGEX_MGS);
    await testInvalidUsernameInput(
      '11111111111111111111111111111111111111111111111',
      KONFLUX_USERNAME_REGEX_MGS,
    );
  });
});
