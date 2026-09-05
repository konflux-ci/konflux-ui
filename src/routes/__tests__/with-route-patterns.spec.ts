import type { RouteObject, UIMatch } from 'react-router-dom';
import { getRoutePatternFromMatches, withRoutePatterns } from '../with-route-patterns';

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
    const [index, workspace, wildcard] = root.children ?? [];
    const [applications, releaseMonitor] = workspace.children ?? [];

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

describe('getRoutePatternFromMatches', () => {
  const asMatch = (routePattern?: string) => ({ handle: { routePattern } }) as UIMatch;

  it("returns the deepest match's routePattern", () => {
    const matches = [asMatch('/'), asMatch('/ns/:workspaceName'), asMatch('/ns/:workspaceName/applications')];

    expect(getRoutePatternFromMatches(matches)).toBe('/ns/:workspaceName/applications');
  });

  it('falls back to /unknown when there are no matches', () => {
    expect(getRoutePatternFromMatches([])).toBe('/unknown');
  });

  it('falls back to /unknown when the deepest match has no routePattern', () => {
    expect(getRoutePatternFromMatches([{ handle: {} } as UIMatch])).toBe('/unknown');
  });
});