import * as React from 'react';
import {
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  MenuToggle,
  Tooltip,
} from '@patternfly/react-core';
import {
  ExternalLinkAltIcon,
  OutlinedQuestionCircleIcon,
} from '@patternfly/react-icons/dist/esm/icons';
import {
  EXTERNAL_DOCUMENTATION_BASE_URL,
  INTERNAL_DOCUMENTATION_BASE_URL,
} from '~/consts/documentation';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import AboutModal from './AboutModal';

export const HelpDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = React.useState(false);
  const [parsedData] = useKonfluxPublicInfo();
  const isInternal = parsedData?.visibility === 'private';
  const documentationLink = isInternal
    ? INTERNAL_DOCUMENTATION_BASE_URL
    : EXTERNAL_DOCUMENTATION_BASE_URL;

  const handleAboutClick = () => {
    setIsOpen(false);
    setIsAboutModalOpen(true);
  };

  const handleDocumentationClick = () => {
    setIsOpen(false);
    window.open(documentationLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <Tooltip content="Help and documentation">
        <Dropdown
          aria-label="Help menu"
          isOpen={isOpen}
          onSelect={() => setIsOpen(false)}
          onOpenChange={setIsOpen}
          toggle={(toggleRef) => (
            <MenuToggle
              ref={toggleRef}
              variant="plain"
              onClick={() => setIsOpen(!isOpen)}
              isExpanded={isOpen}
              aria-label="Help menu toggle"
            >
              <OutlinedQuestionCircleIcon />
            </MenuToggle>
          )}
        >
          <DropdownGroup>
            <DropdownList>
              <DropdownItem key="about" onClick={handleAboutClick} data-test="help-dropdown-about">
                About Konflux
              </DropdownItem>
              <DropdownItem
                key="documentation"
                onClick={handleDocumentationClick}
                data-test="help-dropdown-documentation"
                icon={<ExternalLinkAltIcon />}
              >
                Documentation
              </DropdownItem>
            </DropdownList>
          </DropdownGroup>
        </Dropdown>
      </Tooltip>

      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </>
  );
};
