import React from 'react';
import { ConditionKey } from '~/feature-flags/conditions';
import { ISSUES_PATH } from '../../paths';
import { RouteErrorBoundry } from '../../RouteErrorBoundary';
import issuesRoutes from '../issues';

// Type definitions matching the actual React Router route objects
type BaseRoute = {
  loader?: () => boolean;
  lazy?: () => Promise<{ Component: React.FunctionComponent<Record<string, never>> }>;
  errorElement?: JSX.Element;
};

type IndexRoute = BaseRoute & {
  index: boolean;
  path?: undefined;
};

type PathRoute = BaseRoute & {
  path: string;
  index?: undefined;
};

type ChildRoute = IndexRoute | PathRoute;

type MainIssuesRoute = {
  path: string;
  lazy: () => Promise<{ Component: React.FunctionComponent<Record<string, never>> }>;
  errorElement: JSX.Element;
  children: ChildRoute[];
};

// Mock the RouteErrorBoundary
jest.mock('../../RouteErrorBoundary', () => ({
  RouteErrorBoundry: () => <div data-test="error-boundary">Error Boundary</div>,
}));

// Mock the issuesPageLoader
jest.mock('~/components/Issues', () => ({
  issuesPageLoader: jest.fn(() => ({ data: 'test-data' })),
}));

const mockConditions: Partial<Record<ConditionKey, boolean>> = {};
const mockEnsureConditions = jest.fn().mockResolvedValue(undefined);
const mockEnsureConditionOnLoader = jest.fn();

jest.mock('~/feature-flags/store', () => ({
  FeatureFlagsStore: {
    get conditions() {
      return mockConditions;
    },
    ensureConditions: (...args: unknown[]) => mockEnsureConditions(...args),
  },
}));

jest.mock('~/feature-flags/utils', () => ({
  ...jest.requireActual('~/feature-flags/utils'),
  ensureConditionOnLoader: (...args: unknown[]) => mockEnsureConditionOnLoader(...args),
}));

const getMainRoute = (): MainIssuesRoute => issuesRoutes[0] as MainIssuesRoute;

const ISSUES_UNAVAILABLE_MESSAGE = 'Issues dashboard is unavailable on the cluster.';
const ensureConditionOnLoaderOptions = { errorMessage: ISSUES_UNAVAILABLE_MESSAGE };

describe('Issues Routes Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockConditions).forEach((key) => {
      delete mockConditions[key as ConditionKey];
    });
    mockEnsureConditionOnLoader.mockImplementation(() => undefined);
  });

  it('should export an array of routes', () => {
    expect(Array.isArray(issuesRoutes)).toBe(true);
    expect(issuesRoutes).toHaveLength(1);
  });

  describe('main issues route', () => {
    let mainRoute: MainIssuesRoute;

    beforeEach(() => {
      mainRoute = getMainRoute();
    });

    it('should have correct path', () => {
      expect(mainRoute.path).toBe(ISSUES_PATH.path);
    });

    it('should have lazy loading function', () => {
      expect(typeof mainRoute.lazy).toBe('function');
    });

    it('should have error element', () => {
      expect(mainRoute.errorElement).toBeDefined();
      expect(React.isValidElement(mainRoute.errorElement)).toBe(true);
    });

    it('should use RouteErrorBoundry for route errors', () => {
      expect(mainRoute.errorElement.type).toBe(RouteErrorBoundry);
      expect(mainRoute.errorElement.props).toEqual({});
    });

    it('should have children routes', () => {
      expect(Array.isArray(mainRoute.children)).toBe(true);
      expect(mainRoute.children).toHaveLength(2);
    });

    it('should return Component from lazy function when kite is available', async () => {
      const lazyResult = await mainRoute.lazy();

      expect(lazyResult).toHaveProperty('Component');
      expect(typeof lazyResult.Component).toBe('function');
      expect(mockEnsureConditionOnLoader).toHaveBeenCalledWith(
        ['isKiteServiceEnabled'],
        ensureConditionOnLoaderOptions,
      );
    });

    it('should guard the route with ensureConditionOnLoader before loading the issues page', async () => {
      let conditionChecked = false;

      mockEnsureConditionOnLoader.mockImplementation(() => {
        conditionChecked = true;
      });

      await mainRoute.lazy();

      expect(conditionChecked).toBe(true);
      expect(mockEnsureConditionOnLoader).toHaveBeenCalledWith(
        ['isKiteServiceEnabled'],
        ensureConditionOnLoaderOptions,
      );
    });

    it('should throw 503 when ensureConditionOnLoader rejects the kite condition', async () => {
      mockEnsureConditionOnLoader.mockImplementation(() => {
        throw new Response(ISSUES_UNAVAILABLE_MESSAGE, { status: 503 });
      });

      await expect(mainRoute.lazy()).rejects.toMatchObject({
        status: 503,
      });
    });

    it('should throw 503 when kite condition is unavailable', async () => {
      const { ensureConditionOnLoader: realEnsureConditionOnLoader } =
        jest.requireActual<typeof import('~/feature-flags/utils')>('~/feature-flags/utils');

      mockConditions.isKiteServiceEnabled = false;
      mockEnsureConditionOnLoader.mockImplementation(realEnsureConditionOnLoader);

      const thrown = await mainRoute.lazy().catch((error) => error);

      expect(thrown).toMatchObject({ status: 503 });
      expect(await (thrown as Response).text()).toBe(ISSUES_UNAVAILABLE_MESSAGE);
      expect(mockEnsureConditions).toHaveBeenCalledWith(['isKiteServiceEnabled']);
    });
  });

  describe('overview child route', () => {
    let overviewRoute: IndexRoute;

    beforeEach(() => {
      const [firstChild] = getMainRoute().children;
      overviewRoute = firstChild as IndexRoute;
    });

    it('should be an index route', () => {
      expect(overviewRoute.index).toBe(true);
    });

    it('should have loader function', () => {
      expect(overviewRoute.loader).toBeDefined();
      expect(typeof overviewRoute.loader).toBe('function');
    });

    it('should have lazy loading function', () => {
      expect(typeof overviewRoute.lazy).toBe('function');
    });

    it('should have error element', () => {
      expect(overviewRoute.errorElement).toBeDefined();
      expect(React.isValidElement(overviewRoute.errorElement)).toBe(true);
    });

    it('should return Component from lazy function', async () => {
      const lazyResult = await overviewRoute.lazy();

      expect(lazyResult).toHaveProperty('Component');
      expect(typeof lazyResult.Component).toBe('function');
    });
  });

  describe('list child route', () => {
    let listRoute: PathRoute;

    beforeEach(() => {
      const [, secondChild] = getMainRoute().children;
      listRoute = secondChild as PathRoute;
    });

    it('should have correct path', () => {
      expect(listRoute.path).toBe('list');
    });

    it('should have loader function', () => {
      expect(listRoute.loader).toBeDefined();
      expect(typeof listRoute.loader).toBe('function');
    });

    it('should have lazy loading function', () => {
      expect(typeof listRoute.lazy).toBe('function');
    });

    it('should have error element', () => {
      expect(listRoute.errorElement).toBeDefined();
      expect(React.isValidElement(listRoute.errorElement)).toBe(true);
    });

    it('should return Component from lazy function', async () => {
      const lazyResult = await listRoute.lazy();

      expect(lazyResult).toHaveProperty('Component');
      expect(typeof lazyResult.Component).toBe('function');
    });
  });

  describe('route integration', () => {
    it('should use the same loader for both child routes', () => {
      const [firstChild, secondChild] = getMainRoute().children;
      const overviewRoute = firstChild as IndexRoute;
      const listRoute = secondChild as PathRoute;

      expect(overviewRoute.loader).toBe(listRoute.loader);
    });

    it('should have error boundaries for all routes', () => {
      const mainRoute = getMainRoute();
      const [firstChild, secondChild] = mainRoute.children;
      const overviewRoute = firstChild as IndexRoute;
      const listRoute = secondChild as PathRoute;

      expect(mainRoute.errorElement).toBeDefined();
      expect(overviewRoute.errorElement).toBeDefined();
      expect(listRoute.errorElement).toBeDefined();
    });

    it('should call loader functions without errors', () => {
      const [firstChild, secondChild] = getMainRoute().children;
      const overviewRoute = firstChild as IndexRoute;
      const listRoute = secondChild as PathRoute;

      expect(() => overviewRoute.loader?.()).not.toThrow();
      expect(() => listRoute.loader?.()).not.toThrow();
    });
  });
});
