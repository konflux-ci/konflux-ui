import * as React from 'react';
import {
  Button,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
} from '@patternfly/react-core';
import { FlaskIcon } from '@patternfly/react-icons/dist/esm/icons/flask-icon';
import { createFeatureFlagPanelModal } from '~/feature-flags/Panel';
import { ThemeDropdown } from '~/shared/theme';
import { useModalLauncher } from '../modal/ModalProvider';
import { HelpDropdown } from './HelpDropdown';
import { useCopyLoginCommandAnalytics } from './useCopyLoginCommandAnalytics';
import { UserDropdown } from './UserDropdown';

export const Header: React.FC = () => {
  const showModal = useModalLauncher();
  const { onUserMenuOpen, onCopyLoginCommandClick } = useCopyLoginCommandAnalytics();
  return (
    <Toolbar isFullHeight>
      <ToolbarContent>
        <ToolbarGroup align={{ default: 'alignEnd' }}>
          <ToolbarItem>
            <Tooltip content="Experimental Features">
              <Button
                icon={<FlaskIcon />}
                variant="plain"
                onClick={() => showModal(createFeatureFlagPanelModal())}
                aria-label="Experimental Features"
                data-test="experimental-features-icon"
              />
            </Tooltip>
          </ToolbarItem>
          <ToolbarItem>
            <ThemeDropdown />
          </ToolbarItem>
          <ToolbarItem>
            <HelpDropdown onCliLoginClick={onCopyLoginCommandClick} />
          </ToolbarItem>
          <ToolbarItem>
            <UserDropdown onOpen={onUserMenuOpen} />
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );
};
