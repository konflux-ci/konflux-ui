import React from 'react';
import {
  ComponentDetailsTab,
  ComponentDetailsViewLayout,
} from '~/components/ComponentsPage/ComponentDetails';
import { ActivityTabV2 } from '~/shared/components/activity-tab/ActivityTabV2';
import {
  COMPONENT_ACTIVITY_V2_PATH,
  COMPONENT_DETAILS_V2_PATH,
  COMPONENTS_PATH,
} from '../../paths';
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
  RouteErrorBoundry: () => <div data-testid="error-boundary">Error Boundary</div>,
}));

jest.mock('~/components/ComponentsPage/ComponentDetails', () => ({
  ComponentDetailsTab: () => <div data-testid="component-details-tab">Details tab</div>,
  ComponentDetailsViewLayout: () => <div data-testid="component-details-layout">Layout</div>,
  componentDetailsViewLoader: jest.fn(() => ({ data: 'test-data' })),
}));

describe('Components page routes configuration', () => {
  it('should export an array of routes', () => {
    expect(Array.isArray(componentsPageRoutes)).toBe(true);
    expect(componentsPageRoutes).toHaveLength(2);
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

  it('should include index, activity, and versions child routes', () => {
    const [, detailsRoute] = componentsPageRoutes as [{ path: string }, PathRoute];
    const children = detailsRoute.children ?? [];

    const indexRoute = children.find((r) => 'index' in r && r.index);
    expect(indexRoute).toBeDefined();
    expect(indexRoute?.element).toEqual(<ComponentDetailsTab />);

    const activityRoute = children.find((r) => 'path' in r && r.path === 'activity');
    expect(activityRoute).toBeDefined();
    expect(activityRoute?.path).toBe('activity');
    expect(activityRoute?.element).not.toBeNull();

    const versionsRoute = children.find((r) => 'path' in r && r.path === 'versions');
    expect(versionsRoute).toBeDefined();
    expect(versionsRoute?.element).toBeNull();
  });

  it('should render ActivityTabV2 for the activity route', () => {
    const [, detailsRoute] = componentsPageRoutes as [{ path: string }, PathRoute];
    const children = detailsRoute.children ?? [];
    const activityRoute = children.find((r) => 'path' in r && r.path === 'activity');

    expect(activityRoute?.element).toBeDefined();
    expect(React.isValidElement(activityRoute?.element)).toBe(true);
    expect((activityRoute?.element as React.ReactElement)?.type).toBe(ActivityTabV2);
  });

  it('should expose activity at path /ns/:workspaceName/components/:componentName/activity', () => {
    const [, detailsRoute] = componentsPageRoutes as [{ path: string }, PathRoute];
    const activityRoute = (detailsRoute.children ?? []).find(
      (r) => 'path' in r && r.path === 'activity',
    );

    expect(COMPONENT_ACTIVITY_V2_PATH.path).toBe(`${COMPONENT_DETAILS_V2_PATH.path}/activity`);
    expect(activityRoute?.path).toBe('activity');
    expect(COMPONENT_ACTIVITY_V2_PATH.path).toMatch(/\/activity$/);
  });
});
