import { screen, waitForElementToBeRemoved, fireEvent, act } from '@testing-library/react';

/**
 * Waits for loading spinner to finish
 */
export const waitForLoadingToFinish = async (): Promise<void> =>
  await waitForElementToBeRemoved(() => screen.getByRole('progressbar'));

/**
 * Opens integration test context dropdown
 * Note: Ignores async await ESLint check for test compatibility
 */
/* eslint-disable @typescript-eslint/require-await */
export const openIntegrationTestContextDropdown = async (): Promise<void> => {
  const toggleButton = screen.getByTestId('context-dropdown-toggle').childNodes[1] as HTMLElement;
  expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  await act(async () => {
    fireEvent.click(toggleButton);
  });
  expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
};
/* eslint-enable @typescript-eslint/require-await */

/**
 * Gets integration test context option button by name
 */
export const getIntegrationTestContextOptionButton = (name: string): ChildNode => {
  return screen.getByTestId(`context-option-${name}`).childNodes[0];
};
