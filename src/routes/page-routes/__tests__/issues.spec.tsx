import React from 'react';
import { ISSUES_PATH } from '../../paths';
import issuesRoutes from '../issues';

// Mock the RouteErrorBoundary
jest.mock('../../RouteErrorBoundary', () => ({
  RouteErrorBoundry: () => <div data-testid="error-boundary">Error Boundary</div>,
}));

// Mock the issuesPageLoader
jest.mock('~/components/Issues', () => ({
  issuesPageLoader: jest.fn(() => ({ data: 'test-data' })),
}));

describe('Issues Routes Configuration', () => {
  it('should export an array of routes', () => {
    expect(Array.isArray(issuesRoutes)).toBe(true);
    expect(issuesRoutes).toHaveLength(1);
  });

  describe('main issues route', () => {
    let mainRoute: {
      path: string;
      lazy: () => Promise<{ Component: React.ComponentType }>;
      errorElement: React.ReactNode;
      children: unknown[];
    };

    beforeEach(() => {
      [mainRoute] = issuesRoutes;
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

    it('should have children routes', () => {
      expect(Array.isArray(mainRoute.children)).toBe(true);
      expect(mainRoute.children).toHaveLength(2);
    });

    it('should return Component from lazy function', async () => {
      const lazyResult = await mainRoute.lazy();

      expect(lazyResult).toHaveProperty('Component');
      expect(typeof lazyResult.Component).toBe('function');
    });
  });

  describe('overview child route', () => {
    let overviewRoute: {
      index: boolean;
      loader: () => unknown;
      lazy: () => Promise<{ Component: React.ComponentType }>;
      errorElement: React.ReactNode;
    };

    beforeEach(() => {
      const [mainRoute] = issuesRoutes;
      [overviewRoute] = mainRoute.children;
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
    let listRoute: {
      path: string;
      loader: () => unknown;
      lazy: () => Promise<{ Component: React.ComponentType }>;
      errorElement: React.ReactNode;
    };

    beforeEach(() => {
      const [mainRoute] = issuesRoutes;
      [, listRoute] = mainRoute.children;
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
      const [mainRoute] = issuesRoutes;
      const [overviewRoute, listRoute] = mainRoute.children;

      expect(overviewRoute.loader).toBe(listRoute.loader);
    });

    it('should have error boundaries for all routes', () => {
      const [mainRoute] = issuesRoutes;
      const [overviewRoute, listRoute] = mainRoute.children;

      expect(mainRoute.errorElement).toBeDefined();
      expect(overviewRoute.errorElement).toBeDefined();
      expect(listRoute.errorElement).toBeDefined();
    });

    it('should call loader functions without errors', () => {
      const [mainRoute] = issuesRoutes;
      const [overviewRoute, listRoute] = mainRoute.children;

      expect(() => overviewRoute.loader()).not.toThrow();
      expect(() => listRoute.loader()).not.toThrow();
    });
  });
});
