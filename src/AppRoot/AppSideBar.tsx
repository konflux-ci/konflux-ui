import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Nav, NavItem, NavList, PageSidebar, PageSidebarBody } from '@patternfly/react-core';
import { useWorkspaceInfo } from '../components/Workspace/useWorkspaceInfo';

export const AppSideBar: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const location = useLocation();
  const { workspace } = useWorkspaceInfo();
  return (
    <PageSidebar isSidebarOpen={isOpen}>
      <PageSidebarBody>
        <Nav>
          <NavList>
            <NavItem isActive={location.pathname === '/'}>
              <NavLink to="/">Overview</NavLink>
            </NavItem>
            <NavItem isActive={location.pathname.includes('applications')}>
              <NavLink to={`/workspaces/${workspace}/applications`}>Applications</NavLink>
            </NavItem>
            <NavItem isActive={location.pathname.includes('/secrets')}>
              <NavLink to={`/workspaces/${workspace}/secrets`}>Secrets</NavLink>
            </NavItem>
            <NavItem isActive={location.pathname.includes('/release')}>
              <NavLink to={`/workspaces/${workspace}/release`}>Releases</NavLink>
            </NavItem>
            <NavItem isActive={location.pathname.includes('/access')}>
              <NavLink to={`/workspaces/${workspace}/access`}>User Access</NavLink>
            </NavItem>
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};
