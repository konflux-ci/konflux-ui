import type { RouteObject } from 'react-router-dom';

type RouteHandle = Record<string, unknown> & { routePattern?: string };

const joinRoutePattern = (parentPattern: string, path?: string): string => {
  if (!path) {
    return parentPattern;
  }

  if (path === '*') {
    return '/*';
  }

  if (path.startsWith('/')) {
    return path;
  }

  return parentPattern === '/' ? `/${path}` : `${parentPattern}/${path}`;
};

/**
 * Adds an absolute, privacy-safe route template to every route handle.
 * Index and pathless routes inherit their parent's template.
 */
export const withRoutePatterns = (
  routes: RouteObject[],
  parentPattern = '/',
): RouteObject[] =>
  routes.map((route) => {
    const routePattern = joinRoutePattern(parentPattern, route.path);
    const handle = (route.handle ?? {}) as RouteHandle;

    return {
      ...route,
      handle: { ...handle, routePattern },
      ...(route.children
        ? { children: withRoutePatterns(route.children, routePattern) }
        : {}),
    } as RouteObject;
  });
