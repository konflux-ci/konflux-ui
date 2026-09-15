import { render, screen } from '@testing-library/react';
import { HttpError } from '../../k8s/error';
import { createReactRouterMock, routerRenderer } from '../../utils/test-utils';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

const mockCaptureException = jest.fn().mockReturnValue('test-sentry-event-id');
jest.mock('~/monitoring', () => ({
  monitoringService: {
    captureException: (...args: unknown[]) => mockCaptureException(...args),
  },
}));

describe('RouteErrorBoundary', () => {
  const mockUseRouteError = createReactRouterMock('useRouteError');

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should report error to monitoring service via captureException', () => {
    const testError = { status: 403 };
    mockUseRouteError.mockReturnValue(testError);
    routerRenderer(<RouteErrorBoundry />);
    expect(mockCaptureException).toHaveBeenCalledWith(testError);
  });

  it('should render NoAccessState for 403 errors', () => {
    mockUseRouteError.mockReturnValue({ status: 403 });
    routerRenderer(<RouteErrorBoundry />);
    expect(screen.getByText(`Let's get you access`)).toBeInTheDocument();
  });

  it('should render ErrorEmptyState for HttpErrors', () => {
    const testError = new HttpError('Not found');
    mockUseRouteError.mockReturnValue(testError);
    render(<RouteErrorBoundry />);
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
  });

  it('should render ErrorBoundaryFallback for generic errors', () => {
    const testError = {
      name: 'TestError',
      message: 'Test error message',
      stack: 'test stack',
    };
    mockUseRouteError.mockReturnValue(testError);
    render(<RouteErrorBoundry />);

    expect(screen.getByText('Oh no! Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText('TestError')).toBeInTheDocument();
    expect(screen.getByText(/Test error message/)).toBeInTheDocument();
  });

  it('should display the Sentry event ID for generic errors', () => {
    const testError = {
      name: 'TestError',
      message: 'Test error message',
      stack: 'test stack',
    };
    mockUseRouteError.mockReturnValue(testError);
    render(<RouteErrorBoundry />);

    expect(screen.getByTestId('sentry-event-id')).toBeInTheDocument();
    expect(screen.getByText('test-sentry-event-id')).toBeInTheDocument();
  });

  it('should hide stack trace inside expandable section', () => {
    const testError = {
      name: 'TestError',
      message: 'Test error message',
      stack: 'test stack trace here',
    };
    mockUseRouteError.mockReturnValue(testError);
    render(<RouteErrorBoundry />);

    // Error message visible outside expandable
    expect(screen.getByText(/Test error message/)).toBeInTheDocument();
    // Expandable toggle exists
    expect(screen.getByText('Show more details')).toBeInTheDocument();
  });

  it('should not show event ID when captureException returns undefined', () => {
    mockCaptureException.mockReturnValue(undefined);
    const testError = {
      name: 'TestError',
      message: 'Test error message',
      stack: 'test stack',
    };
    mockUseRouteError.mockReturnValue(testError);
    render(<RouteErrorBoundry />);

    expect(screen.queryByTestId('sentry-event-id')).not.toBeInTheDocument();
  });
});
