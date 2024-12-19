import { fireEvent, screen, act } from '@testing-library/react';

// Ignore this check for the tests.
// If not, the test will throw an error.
/* eslint-disable @typescript-eslint/require-await */
export const openDropdown = async () => {
  const toggleButton = screen.getByTestId('context-dropdown-toggle').childNodes[1];
  expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  await act(async () => {
    fireEvent.click(toggleButton);
  });
  expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
};

export const getContextOptionButton = (name: string) => {
  return screen.getByTestId(`context-option-${name}`).childNodes[0];
};
