import React from 'react';
import { ensureFeatureFlagOnLoader } from '~/feature-flags/utils';
import { DEPENDENCY_SCHEDULE_PATH } from '../../paths';
import dependencyUpdatesScheduleRoutes from '../mintmaker-schedule';

jest.mock('~/feature-flags/utils', () => ({
  ...jest.requireActual('~/feature-flags/utils'),
  ensureFeatureFlagOnLoader: jest.fn(),
}));

const mockEnsureFeatureFlagOnLoader = ensureFeatureFlagOnLoader as jest.Mock;

describe('Dependency updates schedule routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers the dependency updates schedule route', () => {
    expect(dependencyUpdatesScheduleRoutes).toHaveLength(1);

    const [route] = dependencyUpdatesScheduleRoutes;
    expect(route.path).toBe(DEPENDENCY_SCHEDULE_PATH.path);
    expect(route.errorElement).toBeDefined();
    expect(React.isValidElement(route.errorElement)).toBe(true);
  });

  it('guards the route with the MintMaker feature flag before lazy loading the page', async () => {
    const [route] = dependencyUpdatesScheduleRoutes;

    const lazyResult = await route.lazy();

    expect(mockEnsureFeatureFlagOnLoader).toHaveBeenCalledWith('mintmaker');
    expect(lazyResult).toHaveProperty('Component');
    expect(typeof lazyResult.Component).toBe('function');
  });
});
