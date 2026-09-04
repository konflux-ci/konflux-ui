import type { RouteObject } from 'react-router-dom';
import { withRoutePatterns } from '../with-route-patterns';

const getPattern = (route: RouteObject): string =>
  (route.handle as { routePattern: string }).routePattern;

describe('withRoutePatterns', () => {
  it('adds absolute patterns recursively without mutating the source routes', () => {
    const routes: RouteObject[] = [
      {
        path: '/',
        handle: { label: 'root' },
        children: [
          { index: true },
          {
            path: 'ns/:workspaceName',
            children: [
              { path: 'applications/:applicationName?' },
              { path: '/releasemonitor' },
            ],
          },
          { path: '*' },
        ],
      },
    ];

    const decorated = withRoutePatterns(routes);
    const root = decorated[0];
    const [index, workspace, wildcard] = root.children;
    const [applications, releaseMonitor] = workspace.children;

    expect(getPattern(root)).toBe('/');
    expect(root.handle).toEqual({ label: 'root', routePattern: '/' });
    expect(getPattern(index)).toBe('/');
    expect(getPattern(workspace)).toBe('/ns/:workspaceName');
    expect(getPattern(applications)).toBe('/ns/:workspaceName/applications/:applicationName?');
    expect(getPattern(releaseMonitor)).toBe('/releasemonitor');
    expect(getPattern(wildcard)).toBe('/*');
    expect(routes[0].handle).toEqual({ label: 'root' });
    expect(routes[0].children?.[0].handle).toBeUndefined();
  });
});
