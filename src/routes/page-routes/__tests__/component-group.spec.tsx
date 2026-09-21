import {
  ComponentGroupComponentsTab,
  ComponentGroupDetailsViewLayout,
  ComponentGroupIntegrationTestsTab,
  ComponentGroupReleasesTab,
  componentGroupDetailsViewLoader,
} from '~/components/ComponentGroups/ComponentGroupDetails';
import {
  IntegrationTestDetailsView,
  IntegrationTestOverviewTab,
} from '~/components/IntegrationTests/IntegrationTestDetails';
import { GROUP_DETAILS_PATH, GROUP_INTEGRATION_TEST_DETAILS_PATH, GROUPS_PATH } from '../../paths';
import componentGroupRoutes from '../component-group';

jest.mock('../../RouteErrorBoundary', () => ({
  RouteErrorBoundry: () => <div data-test="error-boundary">Error Boundary</div>,
}));

jest.mock('~/components/IntegrationTests/IntegrationTestDetails', () => ({
  integrationDetailsPageLoader: jest.fn(),
  IntegrationTestDetailsView: () => <div data-test="integration-test-details">Details</div>,
  IntegrationTestOverviewTab: () => <div data-test="integration-test-overview">Overview</div>,
}));

jest.mock('~/components/ComponentGroups/ComponentGroupDetails', () => ({
  ComponentGroupComponentsTab: () => <div data-test="components-tab">Components</div>,
  ComponentGroupIntegrationTestsTab: () => (
    <div data-test="integration-tests-tab">Integration tests</div>
  ),
  ComponentGroupReleasesTab: () => <div data-test="releases-tab">Releases</div>,
  ComponentGroupDetailsViewLayout: () => <div data-test="details-layout">Details</div>,
  componentGroupDetailsViewLoader: jest.fn(),
}));

const getRoute = (path: string) => {
  const route = componentGroupRoutes.find((candidate) => candidate.path === path);

  if (!route) {
    throw new Error(`Route not found: ${path}`);
  }

  return route;
};

describe('Component group page routes configuration', () => {
  it('should register the groups list, details, and integration test routes', () => {
    expect(componentGroupRoutes.map((route) => route.path)).toEqual([
      GROUPS_PATH.path,
      GROUP_DETAILS_PATH.path,
      GROUP_INTEGRATION_TEST_DETAILS_PATH.path,
    ]);
  });

  it('should configure the component group details route and its tabs', () => {
    const detailsRoute = getRoute(GROUP_DETAILS_PATH.path);

    if (!('children' in detailsRoute) || !('loader' in detailsRoute)) {
      throw new Error('Expected the component group details route to have a loader and children');
    }

    expect(detailsRoute.loader).toBe(componentGroupDetailsViewLoader);
    expect(detailsRoute.element).toEqual(<ComponentGroupDetailsViewLayout />);
    expect(detailsRoute.children).toHaveLength(4);

    const indexRoute = detailsRoute.children.find((route) => 'index' in route && route.index);

    if (!indexRoute || !('loader' in indexRoute)) {
      throw new Error('Expected the component group details index route to redirect');
    }

    expect(indexRoute.element).toBeUndefined();
    expect(indexRoute.loader).toEqual(expect.any(Function));

    const redirectResponse = indexRoute.loader();
    expect(redirectResponse.status).toBe(302);
    expect(redirectResponse.headers.get('Location')).toBe('components');

    const tabRoutes = detailsRoute.children.filter((route) => 'path' in route);
    expect(tabRoutes).toHaveLength(3);
    expect(tabRoutes.map((route) => ('path' in route ? route.path : undefined))).toEqual([
      'components',
      'integrationtests',
      'releases',
    ]);

    const getTabRoute = (path: string) => {
      const route = tabRoutes.find((candidate) => 'path' in candidate && candidate.path === path);

      if (!route || !('path' in route)) {
        throw new Error(`Tab route not found: ${path}`);
      }

      return route;
    };

    expect(getTabRoute('components').element).toEqual(<ComponentGroupComponentsTab />);
    expect(getTabRoute('integrationtests').element).toEqual(
      <ComponentGroupIntegrationTestsTab />,
    );
    expect(getTabRoute('releases').element).toEqual(<ComponentGroupReleasesTab />);
  });

  it('should configure the component group integration test details route', () => {
    const integrationTestRoute = getRoute(GROUP_INTEGRATION_TEST_DETAILS_PATH.path);

    if (!('children' in integrationTestRoute) || !('loader' in integrationTestRoute)) {
      throw new Error(
        'Expected the component group integration test route to have a loader and children',
      );
    }

    expect(integrationTestRoute.loader).toEqual(expect.any(Function));
    expect(integrationTestRoute.element).toEqual(<IntegrationTestDetailsView />);
    expect(integrationTestRoute.children).toHaveLength(1);
    expect(integrationTestRoute.children[0]).toEqual({
      index: true,
      element: <IntegrationTestOverviewTab />,
    });
  });
});
