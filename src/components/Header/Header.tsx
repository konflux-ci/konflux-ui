import * as React from 'react';
import { Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { UserDropdown } from './UserDropdown';

export const Header: React.FC = () => {
  return (
    <Toolbar isFullHeight>
      <ToolbarContent>
        <ToolbarItem align={{ default: 'alignRight' }}>
          <UserDropdown />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};
