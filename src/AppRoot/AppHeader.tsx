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
import konfluxLogo from '../assets/konflux.svg';
import { Header } from '../components/Header/Header';

export const AppHeader: React.FC<{ isSideBarOpen: boolean; onSideBarOpen: () => void }> = ({
  isSideBarOpen,
  onSideBarOpen,
}) => {
  return (
    <Masthead>
      <MastheadToggle>
        <PageToggleButton
          variant="plain"
          aria-label=""
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
        <Header />
      </MastheadContent>
    </Masthead>
  );
};
