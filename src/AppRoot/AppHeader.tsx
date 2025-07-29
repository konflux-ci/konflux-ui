import * as React from 'react';
import {
  Brand,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  PageToggleButton,
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons/dist/esm/icons/bars-icon';
import { SystemNotificationConfig } from '~/types/notification-type';
import konfluxLogo from '../assets/konflux.svg';
import { Header } from '../components/Header/Header';

interface AppHeaderProos {
  isSideBarOpen: boolean;
  onSideBarOpen: () => void;
  isDrawerExpanded: boolean;
  toggleDrawer: () => void;
  notifications: SystemNotificationConfig[];
}
export const AppHeader: React.FC<AppHeaderProos> = ({
  isSideBarOpen,
  onSideBarOpen,
  isDrawerExpanded,
  toggleDrawer,
  notifications,
}) => {
  return (
    <Masthead>
      <MastheadToggle>
        <PageToggleButton
          variant="plain"
          aria-label="Sidebar toggle"
          data-test="sidebar-toggle"
          onSidebarToggle={onSideBarOpen}
          isSidebarOpen={isSideBarOpen}
        >
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <Brand src={konfluxLogo} alt="konflux" heights={{ default: '36px' }} />
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Header
          isDrawerExpanded={isDrawerExpanded}
          toggleDrawer={toggleDrawer}
          notifications={notifications}
        />
      </MastheadContent>
    </Masthead>
  );
};
