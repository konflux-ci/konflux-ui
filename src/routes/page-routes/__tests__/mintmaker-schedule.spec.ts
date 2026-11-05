import React from 'react';
import { DEPENDENCY_SCHEDULE_PATH } from '../../paths';
import dependencyUpdatesScheduleRoutes from '../mintmaker-schedule';

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

  it('lazy loads the dependency updates schedule page', async () => {
    const [route] = dependencyUpdatesScheduleRoutes;

    const lazyResult = await route.lazy();

    expect(lazyResult).toHaveProperty('Component');
    expect(typeof lazyResult.Component).toBe('function');
  });
});
