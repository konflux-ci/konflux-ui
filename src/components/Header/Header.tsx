import * as React from 'react';
import { Button, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { FlaskIcon } from '@patternfly/react-icons/dist/esm/icons/flask-icon';
import { IfFeature } from '~/feature-flags/hooks';
import { createFeatureFlagPanelModal } from '~/feature-flags/Panel';
import { ThemeDropdown } from '~/shared/theme';
import { useModalLauncher } from '../modal/ModalProvider';
import { UserDropdown } from './UserDropdown';

export const Header: React.FC = () => {
  const showModal = useModalLauncher();
  return (
    <Toolbar isFullHeight>
      <ToolbarContent>
        <ToolbarItem align={{ default: 'alignRight' }}>
          <Button
            variant="plain"
            title="Experimental Features"
            onClick={() => {
              showModal(createFeatureFlagPanelModal());
            }}
          >
            <FlaskIcon />
          </Button>
        </ToolbarItem>
        <IfFeature flag="dark-theme">
          <ToolbarItem>
            <ThemeDropdown />
          </ToolbarItem>
        </IfFeature>
        <ToolbarItem>
          <UserDropdown />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};
