import * as React from 'react';
import {
  Brand,
  Masthead,
  MastheadLogo,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  MastheadBrand,
  PageToggleButton,
} from '@patternfly/react-core';

import konfluxLogo from '../assets/iconsUrl/konflux.svg';
import { Header } from '../components/Header/Header';

interface AppHeaderPros {
  isSideBarOpen: boolean;
  onSideBarOpen: () => void;
  isDrawerExpanded: boolean;
  toggleDrawer: () => void;
}
const AppHeaderComponent: React.FC<AppHeaderPros> = ({
  isSideBarOpen,
  onSideBarOpen,
  isDrawerExpanded,
  toggleDrawer,
}) => {
  return (
    <Masthead>
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton
            isHamburgerButton
            variant="plain"
            aria-label="Sidebar toggle"
            data-test="sidebar-toggle"
            onSidebarToggle={onSideBarOpen}
            isSidebarOpen={isSideBarOpen}
          ></PageToggleButton>
        </MastheadToggle>
        <MastheadBrand data-codemods>
          <MastheadLogo data-codemods>
            <Brand src={konfluxLogo} alt="konflux" heights={{ default: '36px' }} />
          </MastheadLogo>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Header isDrawerExpanded={isDrawerExpanded} toggleDrawer={toggleDrawer} />
      </MastheadContent>
    </Masthead>
  );
};
export const AppHeader = React.memo(AppHeaderComponent);
