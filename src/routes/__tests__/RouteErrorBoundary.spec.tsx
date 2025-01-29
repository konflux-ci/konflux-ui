import { render, screen } from '@testing-library/react';
import { HttpError } from '../../k8s/error';
import { createReactRouterMock, routerRenderer } from '../../utils/test-utils';
import { RouteErrorBoundry } from '../RouteErrorBoundary';

describe('RouteErrorBoundary', () => {
  const mockUseRouteError = createReactRouterMock('useRouteError');

  afterEach(() => {
    jest.clearAllMocks();
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
});
