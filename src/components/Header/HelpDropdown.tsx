import * as React from 'react';
import {
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownList,
  MenuToggle,
  Tooltip,
} from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons';
import {
  EXTERNAL_DOCUMENTATION_BASE_URL,
  INTERNAL_DOCUMENTATION_BASE_URL,
} from '~/consts/documentation';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { ExternalLink } from '~/shared';
import { collectAndMerge, getToursByRoute, useTour } from '~/shared/components/GuidedTours';
import { createFeedbackModal } from '../FeedbackSection/FeedbackModal';
import { useModalLauncher } from '../modal/ModalProvider';
import { createAboutModal } from './AboutModal';

export const HelpDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const showModal = useModalLauncher();
  const { startTour, currentRoute } = useTour();
  const [parsedData] = useKonfluxPublicInfo();
  const isInternal = parsedData?.visibility === 'private';
  const documentationLink = isInternal
    ? INTERNAL_DOCUMENTATION_BASE_URL
    : EXTERNAL_DOCUMENTATION_BASE_URL;

  const handleAboutClick = () => {
    setIsOpen(false);
    showModal(createAboutModal());
  };

  const handleFeedbackClick = () => {
    setIsOpen(false);
    showModal(createFeedbackModal());
  };

  // Check if tours exist for current route
  const toursForRoute = currentRoute ? getToursByRoute(currentRoute) : [];
  const hasTours = toursForRoute.length > 0;

  const handleGuidedTourClick = () => {
    setIsOpen(false);
    if (!currentRoute) return;
    // Manual trigger: get ALL tours for current route, ignoring seen state (per design spec)
    const entries = getToursByRoute(currentRoute);
    if (entries.length === 0) return;
    const result = collectAndMerge(entries);
    if (result.mergedSteps.length === 0) return;
    startTour(result.mergedSteps, result.sourceIds);
  };

  return (
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
            {hasTours && (
              <DropdownItem
                key="guided-tour"
                onClick={handleGuidedTourClick}
                data-test="help-dropdown-guided-tour"
              >
                Guided tour
              </DropdownItem>
            )}
            <DropdownItem key="about" onClick={handleAboutClick} data-test="help-dropdown-about">
              About Konflux
            </DropdownItem>
            <DropdownItem key="documentation" data-test="help-dropdown-documentation">
              <ExternalLink href={documentationLink} text={'Documentation'} />
            </DropdownItem>
            <DropdownItem
              key="share-feedback"
              onClick={handleFeedbackClick}
              data-test="help-dropdown-feedback"
            >
              Share feedback
            </DropdownItem>
          </DropdownList>
        </DropdownGroup>
      </Dropdown>
    </Tooltip>
  );
};
