import React from 'react';
import { linkedSecretsListViewLoader } from '~/components/Components/LinkedSecretsListView';
import { LinkedSecretsListView } from '~/components/Components/LinkedSecretsListView/LinkedSecretsListView';
import { ComponentDependencyTab } from '~/components/ComponentsPage/tabs/ComponentDependencyTab';
import { ComponentVersionsTab } from '~/components/ComponentsPage/tabs/ComponentVersionsTab';
import { ensureFeatureFlagOnLoader } from '~/feature-flags/utils';
import { ActivityTabV2 } from '~/shared/components/activity-tab/ActivityTabV2';
import {
  ComponentDetailsTab,
  ComponentDetailsViewLayout,
} from '../../../components/ComponentsPage/ComponentDetails';
import {
  COMPONENT_DETAILS_V2_PATH,
  COMPONENT_LINKED_SECRETS_V2_PATH,
  COMPONENTS_PATH,
} from '../../paths';
import { RouteErrorBoundry } from '../../RouteErrorBoundary';
import componentsPageRoutes from '../components-page';

type BaseRoute = {
  loader?: () => boolean;
  lazy?: () => Promise<{ Component: React.FunctionComponent<Record<string, never>> }>;
  errorElement?: JSX.Element;
  element?: JSX.Element;
  children?: ChildRoute[];
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

jest.mock('../../RouteErrorBoundary', () => ({
  RouteErrorBoundry: () => <div data-test="error-boundary">Error Boundary</div>,
}));

jest.mock('~/components/ComponentsPage/ComponentDetails', () => ({
  ComponentDetailsTab: () => <div data-test="component-details-tab">Details tab</div>,
  ComponentDetailsViewLayout: () => <div data-test="component-details-layout">Layout</div>,
  componentDetailsViewLoader: jest.fn(() => ({ data: 'test-data' })),
}));

jest.mock('~/feature-flags/utils', () => ({
  ...jest.requireActual('~/feature-flags/utils'),
  ensureFeatureFlagOnLoader: jest.fn(() => {
    throw new Error('feature flag is off');
  }),
}));

jest.mock('~/components/Components/LinkedSecretsListView', () => ({
  ...jest.requireActual('~/components/Components/LinkedSecretsListView'),
  linkedSecretsListViewLoader: jest.fn(() => ({ data: 'linked-secrets-data' })),
}));

describe('Components page routes configuration', () => {
  it('should export an array of routes', () => {
    expect(Array.isArray(componentsPageRoutes)).toBe(true);
    expect(componentsPageRoutes).toHaveLength(3);
  });

  it('should register components list route', () => {
    const [listRoute] = componentsPageRoutes;
    expect(listRoute.path).toBe(COMPONENTS_PATH.path);
  });

  it('should register v2 component details route', () => {
    const [, detailsRoute] = componentsPageRoutes as [{ path: string }, PathRoute];

    expect(detailsRoute.path).toBe(COMPONENT_DETAILS_V2_PATH.path);
    expect(detailsRoute.element).toEqual(<ComponentDetailsViewLayout />);
    expect(detailsRoute.children).toBeDefined();
  });

  it('should register linked secrets route', () => {
    const [, , linkedSecretsRoute] = componentsPageRoutes as [
      { path: string },
      PathRoute,
      PathRoute,
    ];

    expect(linkedSecretsRoute.path).toBe(COMPONENT_LINKED_SECRETS_V2_PATH.path);
    expect(linkedSecretsRoute.element).toEqual(<LinkedSecretsListView />);
    expect(typeof linkedSecretsRoute.loader).toBe('function');
    expect(linkedSecretsRoute.errorElement).toEqual(<RouteErrorBoundry />);
  });

  it('should throw from the linked secrets loader when the component-model flag is off', () => {
    const [, , linkedSecretsRoute] = componentsPageRoutes as [
      { path: string },
      PathRoute,
      PathRoute,
    ];

    expect(() => (linkedSecretsRoute.loader as (args: unknown) => unknown)({ params: {} })).toThrow(
      'feature flag is off',
    );
    expect(ensureFeatureFlagOnLoader).toHaveBeenCalledWith('component-model');
  });

  it('should forward loader args to the linked secrets view loader when the flag is on', () => {
    (ensureFeatureFlagOnLoader as jest.Mock).mockImplementationOnce(() => undefined);
    const [, , linkedSecretsRoute] = componentsPageRoutes as [
      { path: string },
      PathRoute,
      PathRoute,
    ];
    const args = { params: { workspaceName: 'test-ws' } };

    const result = (linkedSecretsRoute.loader as (args: unknown) => unknown)(args);

    expect(linkedSecretsListViewLoader).toHaveBeenCalledWith(args);
    expect(result).toEqual({ data: 'linked-secrets-data' });
  });

  it('should include index, activity, version, and dependency update child routes', () => {
    const [, detailsRoute] = componentsPageRoutes as [{ path: string }, PathRoute];
    const [indexRoute, activityWithTabRoute, activityRoute, versionsRoute, dependencyRoute] =
      detailsRoute.children;

    expect(indexRoute.index).toBe(true);
    expect(indexRoute.element).toEqual(<ComponentDetailsTab />);

    expect(activityWithTabRoute.path).toBe('activity/:activityTab');
    expect(activityWithTabRoute.element).toEqual(<ActivityTabV2 />);

    expect(activityRoute.path).toBe('activity');
    expect(activityRoute.element).toEqual(<ActivityTabV2 />);

    expect(versionsRoute.path).toBe('versions');
    expect(versionsRoute.element).toEqual(<ComponentVersionsTab />);

    expect(dependencyRoute.path).toBe('dep-updates');
    expect(dependencyRoute.element).toEqual(<ComponentDependencyTab />);
  });
});
