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
import KonfluxLogo from '../assets/konflux-logo.svg';
import { Header } from '../components/Header/Header';

interface AppHeaderPros {
  isSideBarOpen: boolean;
  onSideBarOpen: () => void;
}
const AppHeaderComponent: React.FC<AppHeaderPros> = ({ isSideBarOpen, onSideBarOpen }) => {
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
          />
        </MastheadToggle>
        <MastheadBrand>
          <MastheadLogo>
            <Brand alt="" heights={{ default: '36px' }}>
              <KonfluxLogo aria-label="konflux" />
            </Brand>
          </MastheadLogo>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Header />
      </MastheadContent>
    </Masthead>
  );
};
export const AppHeader = React.memo(AppHeaderComponent);
