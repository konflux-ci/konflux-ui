import * as React from 'react';
import { Link, NavLink, useLocation, matchPath } from 'react-router-dom';
import { Nav, NavItem, NavList, PageSidebar, PageSidebarBody } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import {
  APPLICATION_LIST_PATH,
  NAMESPACE_LIST_PATH,
  RELEASE_SERVICE_PATH,
  SECRET_LIST_PATH,
} from '@routes/paths';
import { useNamespace } from '../shared/providers/Namespace';

import './AppSideBar.scss';

export function useActiveRouteChecker() {
  const location = useLocation();

  /**
   * Checks if the given route pattern matches the current location.
   * @param pattern The route pattern to test, e.g. '/workspaces' or '/workspaces/:namespace/applications/*'
   * @param options Options for matching. If exact is true, only an exact match is considered active.
   * @returns True if the pattern is active, false otherwise.
   */
  return (pattern, options?: { exact?: boolean }): boolean => {
    // Using React Router's matchPath to test the pattern against the current pathname.
    const match = matchPath({ path: pattern, end: options?.exact ?? false }, location.pathname);
    return Boolean(match);
  };
}

export const AppSideBar: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const isActive = useActiveRouteChecker();
  const namespace = useNamespace();
  const disabled = !namespace;
  return (
    <PageSidebar isSidebarOpen={isOpen}>
      <PageSidebarBody>
        <Nav>
          <NavList>
            <NavItem isActive={isActive('/', { exact: true })}>
              <NavLink to="/">Overview</NavLink>
            </NavItem>

            <NavItem
              isActive={isActive(NAMESPACE_LIST_PATH.path, {
                exact: true,
              })}
            >
              <NavLink to={NAMESPACE_LIST_PATH.createPath({} as never)}>Namespaces</NavLink>
            </NavItem>

            <NavItem
              className={css({ 'app-side-bar__nav-item--disabled': disabled })}
              isActive={isActive(APPLICATION_LIST_PATH.path)}
            >
              <Link
                to={
                  namespace
                    ? APPLICATION_LIST_PATH.createPath({ workspaceName: namespace })
                    : undefined
                }
              >
                Applications
              </Link>
            </NavItem>

            <NavItem
              className={css({ 'app-side-bar__nav-item--disabled': disabled })}
              isActive={isActive(SECRET_LIST_PATH.path)}
            >
              <NavLink
                to={
                  namespace ? SECRET_LIST_PATH.createPath({ workspaceName: namespace }) : undefined
                }
              >
                Secrets
              </NavLink>
            </NavItem>

            <NavItem
              className={css({ 'app-side-bar__nav-item--disabled': disabled })}
              isActive={isActive(RELEASE_SERVICE_PATH.path)}
            >
              <NavLink
                to={
                  namespace
                    ? RELEASE_SERVICE_PATH.createPath({ workspaceName: namespace })
                    : undefined
                }
              >
                Releases
              </NavLink>
            </NavItem>

            <NavItem
              className={css({ 'app-side-bar__nav-item--disabled': disabled })}
              isActive={isActive(`/workspaces/${namespace}/access`)}
            >
              <NavLink to={namespace ? `/workspaces/${namespace}/access` : null}>
                User Access
              </NavLink>
            </NavItem>
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};
