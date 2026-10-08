import type { LoaderFunctionArgs } from 'react-router-dom';
import {
  ComponentGroupComponentsTab,
  ComponentGroupDetailsViewLayout,
  ComponentGroupIntegrationTestsTab,
  ComponentGroupPipelineRunsTab,
  ComponentGroupReleasesTab,
  componentGroupDetailsViewLoader,
} from '~/components/ComponentGroups/ComponentGroupDetails';
import { ComponentGroupSnapshotsTab } from '~/components/ComponentGroups/ComponentGroupDetails/tabs/ComponentGroupSnapshotsTab';
import {
  IntegrationTestDetailsView,
  IntegrationTestOverviewTab,
  IntegrationTestPipelineRunTabV2,
} from '~/components/IntegrationTests/IntegrationTestDetails';
import { GroupSnapshotDetailsView, GroupSnapshotOverview } from '~/components/SnapshotDetails';
import { snapshotsTabLoader } from '~/components/Snapshots/SnapshotsListView/SnapshotsTab';
import {
  GROUP_DETAILS_PATH,
  GROUP_INTEGRATION_TEST_DETAILS_PATH,
  GROUP_SNAPSHOT_DETAILS_PATH,
  GROUPS_PATH,
} from '../../paths';
import componentGroupRoutes from '../component-group';

jest.mock('../../RouteErrorBoundary', () => ({
  RouteErrorBoundry: () => <div data-test="error-boundary">Error Boundary</div>,
}));

jest.mock('~/components/IntegrationTests/IntegrationTestDetails', () => ({
  integrationDetailsPageLoader: jest.fn(),
  IntegrationTestDetailsView: () => <div data-test="integration-test-details">Details</div>,
  IntegrationTestOverviewTab: () => <div data-test="integration-test-overview">Overview</div>,
  IntegrationTestPipelineRunTabV2: () => (
    <div data-test="integration-test-pipeline-runs">Pipeline runs</div>
  ),
}));

jest.mock('~/components/ComponentGroups/ComponentGroupDetails', () => ({
  ComponentGroupComponentsTab: () => <div data-test="components-tab">Components</div>,
  ComponentGroupIntegrationTestsTab: () => (
    <div data-test="integration-tests-tab">Integration tests</div>
  ),
  ComponentGroupPipelineRunsTab: () => <div data-test="pipeline-runs-tab">Pipeline runs</div>,
  ComponentGroupReleasesTab: () => <div data-test="releases-tab">Releases</div>,
  ComponentGroupDetailsViewLayout: () => <div data-test="details-layout">Details</div>,
  componentGroupDetailsViewLoader: jest.fn(),
}));

jest.mock(
  '~/components/ComponentGroups/ComponentGroupDetails/tabs/ComponentGroupSnapshotsTab',
  () => ({
    ComponentGroupSnapshotsTab: () => <div data-test="snapshots-tab">Snapshots</div>,
  }),
);

jest.mock('~/components/SnapshotDetails', () => ({
  GroupSnapshotDetailsView: () => <div data-test="group-snapshot-details">Details</div>,
  GroupSnapshotOverview: () => <div data-test="group-snapshot-overview">Overview</div>,
  snapshotDetailsViewLoader: jest.fn(),
}));

jest.mock('~/components/Snapshots/SnapshotsListView/SnapshotsTab', () => ({
  snapshotsTabLoader: jest.fn(),
}));

const getRoute = (path: string) => {
  const route = componentGroupRoutes.find((candidate) => candidate.path === path);

  if (!route) {
    throw new Error(`Route not found: ${path}`);
  }

  return route;
};

describe('Component group page routes configuration', () => {
  it('should register all component group routes', () => {
    expect(componentGroupRoutes.map((route) => route.path)).toEqual([
      GROUP_SNAPSHOT_DETAILS_PATH.path,
      GROUPS_PATH.path,
      GROUP_DETAILS_PATH.path,
      GROUP_INTEGRATION_TEST_DETAILS_PATH.path,
    ]);
  });

  it('should configure the component group details route and all of its tabs', () => {
    const detailsRoute = getRoute(GROUP_DETAILS_PATH.path);

    if (!('children' in detailsRoute) || !('loader' in detailsRoute)) {
      throw new Error('Expected the component group details route to have a loader and children');
    }

    expect(detailsRoute.loader).toBe(componentGroupDetailsViewLoader);
    expect(detailsRoute.element).toEqual(<ComponentGroupDetailsViewLayout />);
    expect(detailsRoute.children).toHaveLength(6);

    const indexRoute = detailsRoute.children.find((route) => 'index' in route && route.index);

    if (!indexRoute || !('loader' in indexRoute)) {
      throw new Error('Expected the component group details index route to redirect');
    }

    expect(indexRoute.element).toBeUndefined();
    expect(indexRoute.loader).toEqual(expect.any(Function));

    const redirectResponse = indexRoute.loader({
      request: new Request('http://localhost'),
      params: {},
      context: undefined,
    } as LoaderFunctionArgs);

    if (!(redirectResponse instanceof Response)) {
      throw new Error('Expected the component group details index route to return a redirect');
    }

    expect(redirectResponse.status).toBe(302);
    expect(redirectResponse.headers.get('Location')).toBe('components');

    const tabRoutes = detailsRoute.children.filter((route) => 'path' in route);
    expect(tabRoutes).toHaveLength(5);
    expect(tabRoutes.map((route) => ('path' in route ? route.path : undefined))).toEqual([
      'components',
      'integrationtests',
      'pipelineruns',
      'snapshots',
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
    expect(getTabRoute('integrationtests').element).toEqual(<ComponentGroupIntegrationTestsTab />);
    expect(getTabRoute('pipelineruns').element).toEqual(<ComponentGroupPipelineRunsTab />);

    const snapshotsRoute = getTabRoute('snapshots');
    if (!('loader' in snapshotsRoute)) {
      throw new Error('Expected the component group snapshots tab to have a loader');
    }

    expect(snapshotsRoute.loader).toBe(snapshotsTabLoader);
    expect(snapshotsRoute.element).toEqual(<ComponentGroupSnapshotsTab />);
    expect(getTabRoute('releases').element).toEqual(<ComponentGroupReleasesTab />);
  });

  it('should configure the component group snapshot details route', () => {
    const snapshotRoute = getRoute(GROUP_SNAPSHOT_DETAILS_PATH.path);

    if (!('children' in snapshotRoute) || !('loader' in snapshotRoute)) {
      throw new Error(
        'Expected the component group snapshot details route to have a loader and children',
      );
    }

    expect(snapshotRoute.loader).toEqual(expect.any(Function));
    expect(snapshotRoute.element).toEqual(<GroupSnapshotDetailsView />);
    expect(snapshotRoute.children).toEqual([
      {
        index: true,
        element: <GroupSnapshotOverview />,
      },
    ]);
  });

  it('should configure the component group integration test details route and its tabs', () => {
    const integrationTestRoute = getRoute(GROUP_INTEGRATION_TEST_DETAILS_PATH.path);

    if (!('children' in integrationTestRoute) || !('loader' in integrationTestRoute)) {
      throw new Error(
        'Expected the component group integration test route to have a loader and children',
      );
    }

    expect(integrationTestRoute.loader).toEqual(expect.any(Function));
    expect(integrationTestRoute.element).toEqual(<IntegrationTestDetailsView />);
    expect(integrationTestRoute.children).toEqual([
      {
        index: true,
        element: <IntegrationTestOverviewTab />,
      },
      {
        path: 'pipelineruns',
        element: <IntegrationTestPipelineRunTabV2 />,
      },
    ]);
  });
});
