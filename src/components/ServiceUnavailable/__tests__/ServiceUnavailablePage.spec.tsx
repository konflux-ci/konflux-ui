import '@testing-library/jest-dom';
import { useNavigate } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  DEFAULT_SERVICE_UNAVAILABLE_MESSAGE,
  SERVICE_UNAVAILABLE_MESSAGES,
} from '../condition-messages';
import ServiceUnavailablePage from '../ServiceUnavailablePage';

let mockPathname = '/';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(),
    useLocation: () => ({ pathname: mockPathname }),
  };
});

const useNavigateMock = useNavigate as jest.Mock;

describe('ServiceUnavailablePage', () => {
  let navigateMock: jest.Mock;

  beforeEach(() => {
    mockPathname = '/';
    navigateMock = jest.fn();
    useNavigateMock.mockImplementation(() => navigateMock);
  });

  it('should render the service unavailable state with the default message', () => {
    render(<ServiceUnavailablePage />);

    screen.getByTestId('service-unavailable-state');
    screen.getByText('Service unavailable');
    screen.getByText(DEFAULT_SERVICE_UNAVAILABLE_MESSAGE);
    screen.getByText('Go to Overview page');
  });

  it('should render the issues-specific message for namespace issues routes', () => {
    mockPathname = '/ns/test-ns/issues';

    render(<ServiceUnavailablePage />);

    screen.getByText(SERVICE_UNAVAILABLE_MESSAGES.issues);
  });

  it('should render the default message for unknown namespace services', () => {
    mockPathname = '/ns/test-ns/unknown-service';

    render(<ServiceUnavailablePage />);

    screen.getByText(DEFAULT_SERVICE_UNAVAILABLE_MESSAGE);
  });

  it('should navigate to the overview page', async () => {
    render(<ServiceUnavailablePage />);

    fireEvent.click(screen.getByTestId('service-unavailable-action'));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/');
    });
  });
});
