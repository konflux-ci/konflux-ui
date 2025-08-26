import * as React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Nav, NavItem, NavList, PageSidebar, PageSidebarBody } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import {
  APPLICATION_LIST_PATH,
  NAMESPACE_LIST_PATH,
  RELEASE_MONITOR_PATH,
  RELEASE_SERVICE_PATH,
  SECRET_LIST_PATH,
  USER_ACCESS_LIST_PAGE,
} from '@routes/paths';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { IfFeature } from '~/feature-flags/hooks';
import { useActiveRouteChecker } from '../../src/hooks/useActiveRouteChecker';
import { useNamespace } from '../shared/providers/Namespace';

import './AppSideBar.scss';

export const AppSideBar: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const isActive = useActiveRouteChecker();
  const namespace = useNamespace();
  const disabled = !namespace;
  return (
    <PageSidebar data-test="sidebar" isSidebarOpen={isOpen}>
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

            <IfFeature flag="release-monitor">
              <NavItem
                isActive={isActive(RELEASE_MONITOR_PATH.path, {
                  exact: true,
                })}
              >
                <NavLink to={RELEASE_MONITOR_PATH.createPath({} as never)}>
                  Release Monitor <FeatureFlagIndicator flags={['release-monitor']} />
                </NavLink>
              </NavItem>
            </IfFeature>

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
              isActive={isActive(USER_ACCESS_LIST_PAGE.createPath({ workspaceName: namespace }))}
            >
              <NavLink
                to={
                  namespace ? USER_ACCESS_LIST_PAGE.createPath({ workspaceName: namespace }) : null
                }
              >
                User Access
              </NavLink>
            </NavItem>
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};
