import * as React from 'react';
import {
  Masthead,
  MastheadBrand,
  MastheadMain,
  MastheadToggle,
  PageToggleButton,
} from '@patternfly/react-core';
import BarsIcon from '@patternfly/react-icons/dist/js/icons/bars-icon';

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
        <MastheadBrand>Konflux Logo</MastheadBrand>
      </MastheadMain>
    </Masthead>
  );
};
