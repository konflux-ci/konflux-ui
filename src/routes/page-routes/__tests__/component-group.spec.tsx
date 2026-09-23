import React from 'react';
import { GROUP_DETAILS_PATH, GROUPS_PATH } from '../../paths';
import componentGroupRoutes from '../component-group';

jest.mock('../../RouteErrorBoundary', () => ({
  RouteErrorBoundry: () => <div data-test="error-boundary">Error Boundary</div>,
}));

jest.mock('~/components/ComponentGroups/ComponentGroupsDetails', () => ({
  ComponentGroupComponentsTab: () => <div data-test="components-tab">Components</div>,
  ComponentGroupDetailsViewLayout: () => <div data-test="details-layout">Details</div>,
  componentGroupDetailsViewLoader: jest.fn(),
}));

describe('Component group page routes configuration', () => {
  it('should register the groups list and details routes', () => {
    expect(componentGroupRoutes).toHaveLength(2);
    expect(componentGroupRoutes[0].path).toBe(GROUPS_PATH.path);
    expect(componentGroupRoutes[1].path).toBe(GROUP_DETAILS_PATH.path);
  });

  it('should redirect the details index route to components', () => {
    const detailsRoute = componentGroupRoutes[1];
    const indexRoute = detailsRoute.children?.find((route) => route.index);

    expect(indexRoute).toBeDefined();
    expect(indexRoute?.element).toBeUndefined();
    expect(indexRoute?.loader).toEqual(expect.any(Function));

    const redirectResponse = indexRoute?.loader?.();
    expect(redirectResponse.status).toBe(302);
    expect(redirectResponse.headers.get('Location')).toBe('components');
  });

  it('should render the components child route', () => {
    const detailsRoute = componentGroupRoutes[1];
    const componentsRoute = detailsRoute.children?.find((route) => route.path === 'components');

    expect(React.isValidElement(componentsRoute?.element)).toBe(true);
    expect(componentsRoute?.element?.type).toHaveProperty('$$typeof', Symbol.for('react.lazy'));
  });
});
