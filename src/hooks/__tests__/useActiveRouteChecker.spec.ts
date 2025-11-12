import { renderHook } from '@testing-library/react-hooks';
import { useActiveRouteChecker } from '../useActiveRouteChecker';

// Mock react-router-dom functions
const useLocationMock = jest.fn();
const matchPathMock = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => useLocationMock(),
  matchPath: (...args: unknown[]) => matchPathMock(...args),
}));

describe('useActiveRouteChecker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for exact matching routes', () => {
    useLocationMock.mockReturnValue({ pathname: '/ns/test-namespace/applications' });
    matchPathMock.mockReturnValue({ path: '/ns/:namespace/applications' });

    const { result } = renderHook(() => useActiveRouteChecker());
    const isActive = result.current('/ns/:namespace/applications', { exact: true });

    expect(matchPathMock).toHaveBeenCalledWith(
      { path: '/ns/:namespace/applications', end: true },
      '/ns/test-namespace/applications',
    );
    expect(isActive).toBe(true);
  });

  it('should return false when route does not match', () => {
    useLocationMock.mockReturnValue({ pathname: '/ns/test-namespace/applications' });
    matchPathMock.mockReturnValue(null);

    const { result } = renderHook(() => useActiveRouteChecker());
    const isActive = result.current('/different-route');

    expect(matchPathMock).toHaveBeenCalledWith(
      { path: '/different-route', end: false },
      '/ns/test-namespace/applications',
    );
    expect(isActive).toBe(false);
  });

  it('should use exact: false by default', () => {
    useLocationMock.mockReturnValue({ pathname: '/ns/test-namespace/applications/app1' });
    matchPathMock.mockReturnValue({ path: '/ns/:namespace/applications' });

    const { result } = renderHook(() => useActiveRouteChecker());
    result.current('/ns/:namespace/applications');

    expect(matchPathMock).toHaveBeenCalledWith(
      { path: '/ns/:namespace/applications', end: false },
      '/ns/test-namespace/applications/app1',
    );
  });

  it('should handle wildcard patterns', () => {
    useLocationMock.mockReturnValue({ pathname: '/ns/test-namespace/applications/app1/details' });
    matchPathMock.mockReturnValue({ path: '/ns/:namespace/applications/*' });

    const { result } = renderHook(() => useActiveRouteChecker());
    const isActive = result.current('/ns/:namespace/applications/*');

    expect(isActive).toBe(true);
  });

  it('should re-evaluate when location changes', () => {
    const initialLocation = { pathname: '/ns/test-namespace/applications' };
    const updatedLocation = { pathname: '/ns/test-namespace/components' };

    useLocationMock.mockReturnValue(initialLocation);

    const { result, rerender } = renderHook(() => useActiveRouteChecker());

    // Initial check
    matchPathMock.mockReturnValue({ path: '/ns/:namespace/applications' });
    let isActive = result.current('/ns/:namespace/applications');
    expect(isActive).toBe(true);

    // Change location
    useLocationMock.mockReturnValue(updatedLocation);
    rerender();

    // Should return false for the old pattern
    matchPathMock.mockReturnValue(null);
    isActive = result.current('/ns/:namespace/applications');
    expect(isActive).toBe(false);

    // Should return true for the new pattern
    matchPathMock.mockReturnValue({ path: '/ns/:namespace/components' });
    isActive = result.current('/ns/:namespace/components');
    expect(isActive).toBe(true);
  });

  it('should handle root path matching', () => {
    useLocationMock.mockReturnValue({ pathname: '/' });
    matchPathMock.mockReturnValue({ path: '/' });

    const { result } = renderHook(() => useActiveRouteChecker());
    const isActive = result.current('/', { exact: true });

    expect(isActive).toBe(true);
  });

  it('should handle nested routes with parameters', () => {
    useLocationMock.mockReturnValue({
      pathname: '/ns/my-namespace/applications/my-app/components/my-component',
    });
    matchPathMock.mockReturnValue({
      path: '/ns/:namespace/applications/:applicationName/components/:componentName',
    });

    const { result } = renderHook(() => useActiveRouteChecker());
    const isActive = result.current(
      '/ns/:namespace/applications/:applicationName/components/:componentName',
    );

    expect(isActive).toBe(true);
  });

  it('should be memoized and not recreate function on every render', () => {
    useLocationMock.mockReturnValue({ pathname: '/ns/test-namespace/applications' });

    const { result, rerender } = renderHook(() => useActiveRouteChecker());
    const firstFunction = result.current;

    // Rerender without changing location
    rerender();
    const secondFunction = result.current;

    expect(firstFunction).toBe(secondFunction);
  });

  it('should handle complex route patterns', () => {
    useLocationMock.mockReturnValue({
      pathname: '/ns/konflux-ci-e2e-x4z9k/applications/test-app/pipelineruns',
    });
    matchPathMock.mockReturnValue({ path: '/ns/:namespace/*' });

    const { result } = renderHook(() => useActiveRouteChecker());

    // Test broad pattern matching
    const isBroadMatch = result.current('/ns/:namespace/*');
    expect(isBroadMatch).toBe(true);

    // Test specific pattern matching
    matchPathMock.mockReturnValue({
      path: '/ns/:namespace/applications/:applicationName/pipelineruns',
    });
    const isSpecificMatch = result.current(
      '/ns/:namespace/applications/:applicationName/pipelineruns',
    );
    expect(isSpecificMatch).toBe(true);
  });
});
