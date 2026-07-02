import '@testing-library/jest-dom';
import { useNavigate } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ServiceUnavailablePage from '../ServiceUnavailablePage';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
  };
});

const useNavigateMock = useNavigate as jest.Mock;

const DEFAULT_ERROR_MESSAGE = 'The required page is not available on the cluster.';
const CUSTOM_ERROR_MESSAGE = 'Issues dashboard is unavailable on the cluster.';

describe('ServiceUnavailablePage', () => {
  let navigateMock: jest.Mock;

  beforeEach(() => {
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
  });

  it('should render the service unavailable state with the provided message', () => {
    render(<ServiceUnavailablePage errorMessage={DEFAULT_ERROR_MESSAGE} />);

    screen.getByTestId('service-unavailable-state');
    screen.getByText('Service unavailable');
    screen.getByText(DEFAULT_ERROR_MESSAGE);
    screen.getByText('Go to Overview page');
  });

  it('should render a custom error message', () => {
    render(<ServiceUnavailablePage errorMessage={CUSTOM_ERROR_MESSAGE} />);

    screen.getByText(CUSTOM_ERROR_MESSAGE);
  });

  it('should navigate to the overview page', async () => {
    render(<ServiceUnavailablePage errorMessage={DEFAULT_ERROR_MESSAGE} />);

    fireEvent.click(screen.getByTestId('service-unavailable-action'));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
  });
});
