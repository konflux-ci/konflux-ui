import * as React from 'react';
import {
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  MenuToggle,
} from '@patternfly/react-core';
import { useAuth } from '~/auth/useAuth';

type UserDropdownProps = {
  onOpen?: () => void;
};

export const UserDropdown: React.FC<UserDropdownProps> = ({ onOpen }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const {
    user: { email },
    signOut,
  } = useAuth();

  return (
    <Dropdown
      aria-label="User action"
      isOpen={isOpen}
      onSelect={() => setIsOpen(!isOpen)}
      onOpenChange={setIsOpen}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          isFullHeight
          onClick={() => {
            if (!isOpen) {
              onOpen?.();
            }
            setIsOpen(!isOpen);
          }}
        >
          {email}
        </MenuToggle>
      )}
    >
      <DropdownGroup>
        <DropdownList>
          <DropdownItem onClick={() => signOut?.()}>Log out</DropdownItem>
        </DropdownList>
      </DropdownGroup>
    </Dropdown>
  );
};
