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
        <Header isDrawerExpanded={isDrawerExpanded} toggleDrawer={toggleDrawer} />
      </MastheadContent>
    </Masthead>
  );
};
export const AppHeader = React.memo(AppHeaderComponent);
