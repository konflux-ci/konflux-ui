import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Nav, NavItem, NavList, PageSidebar, PageSidebarBody } from '@patternfly/react-core';
import { APPLICATION_LIST_PATH, NAMESPACE_LIST_PATH } from '@routes/paths';
import { useNamespace } from '../shared/providers/Namespace';

export const AppSideBar: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const location = useLocation();
  const namespace = useNamespace();
  return (
    <PageSidebar isSidebarOpen={isOpen}>
      <PageSidebarBody>
        <Nav>
          <NavList>
            <NavItem isActive={location.pathname === '/'}>
              <NavLink to="/">Overview</NavLink>
            </NavItem>
            <NavItem isActive={location.pathname.includes('workspaces')}>
              <NavLink to={NAMESPACE_LIST_PATH.createPath({} as never)}>Namespaces</NavLink>
            </NavItem>
            <NavItem isActive={location.pathname.includes('applications')}>
              <NavLink to={APPLICATION_LIST_PATH.createPath({ workspaceName: namespace })}>
                Applications
              </NavLink>
            </NavItem>
            <NavItem isActive={location.pathname.includes('/secrets')}>
              <NavLink to={`/workspaces/${namespace}/secrets`}>Secrets</NavLink>
            </NavItem>
            <NavItem isActive={location.pathname.includes('/release')}>
              <NavLink to={`/workspaces/${namespace}/release`}>Releases</NavLink>
            </NavItem>
            <NavItem isActive={location.pathname.includes('/access')}>
              <NavLink to={`/workspaces/${namespace}/access`}>User Access</NavLink>
            </NavItem>
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};
