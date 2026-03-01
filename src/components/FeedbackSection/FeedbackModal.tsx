import * as React from 'react';
import { ModalVariant, Flex, FlexItem, Bullseye, Spinner, Panel } from '@patternfly/react-core';
import { ErrorBoundary } from '@sentry/react';
import { ComponentProps, createModalLauncher } from '~/components/modal/createModalLauncher';
import { THEME_DARK, useTheme } from '~/shared';
import RHsupportDark from '../../assets/rh_feedback--dark.svg';
import RHsupportLight from '../../assets/rh_feedback.svg';
import BeginningSection from './components/BeginningSection';
import { FeedbackSections } from './consts';
import { BugInfo, FeatureInfo } from './feedback-utils';

const BugRFESection = React.lazy(() => import('./components/BugRFEForm'));
const FeedbackSection = React.lazy(() => import('./components/FeedbackForm'));

import './FeedbackModal.scss';

export type FeedbackFormValues = {
  bug?: BugInfo;
  feature?: FeatureInfo;
  feedback?: { description: string; scale: number };
};

const FeedbackModal: React.FC<React.PropsWithChildren<ComponentProps>> = ({ onClose }) => {
  const [currentSection, setCurrentSection] = React.useState<FeedbackSections>(
    FeedbackSections.BeginningSection,
  );
  const { effectiveTheme } = useTheme();
  // const [konfluxInfo] = useKonfluxPublicInfo();

  // const handleSubmit = (values: { bug?: BugInfo; feature?: FeatureInfo }) => {
  //   if (currentSection === FeedbackSections.BugSection) {
  //     const { bug } = values;
  //     const url = getBugURL(bug, konfluxInfo);
  //     window.open(url, '_blank');
  //     onClose(null, { submitClicked: true });
  //   }

  //   if (currentSection === FeedbackSections.FeatureSection) {
  //     const { feature } = values;
  //     const url = getFeatureURL(feature);
  //     window.open(url, '_blank');
  //     onClose(null, { submitClicked: true });
  //   }
  //   if (currentSection === FeedbackSections.FeedbackSection) {
  //     // Add Sentry/Segment connection here
  //     onClose(null, { submitClicked: true });
  //   }
  // };

  return (
    <Flex
      className="feedback-modal__feedback-flex"
      direction={{ default: 'row' }}
      alignItems={{ default: 'alignItemsStretch' }}
    >
      <FlexItem className="feedback-modal__feedback-description" flex={{ default: 'flex_2' }}>
        <Panel isScrollable className="feedback-modal__panel-content">
          <ErrorBoundary>
            <React.Suspense
              fallback={
                <Bullseye>
                  <Spinner size="xl" />
                </Bullseye>
              }
            >
              {currentSection === FeedbackSections.BeginningSection && (
                <BeginningSection setCurrentSection={setCurrentSection} onClose={onClose} />
              )}
              {currentSection === FeedbackSections.FeedbackSection && (
                <FeedbackSection onClose={onClose} setCurrentSection={setCurrentSection} />
              )}
              {currentSection === FeedbackSections.BugSection && (
                <BugRFESection
                  currentSection={FeedbackSections.BugSection}
                  onClose={onClose}
                  setCurrentSection={setCurrentSection}
                />
              )}
              {currentSection === FeedbackSections.FeatureSection && (
                <BugRFESection
                  currentSection={FeedbackSections.FeatureSection}
                  onClose={onClose}
                  setCurrentSection={setCurrentSection}
                />
              )}
            </React.Suspense>
          </ErrorBoundary>
        </Panel>
      </FlexItem>

      <FlexItem className="feedback-modal__image-flex" flex={{ default: 'flex_1' }}>
        {effectiveTheme === THEME_DARK ? (
          <RHsupportDark className="feedback-modal__feedback-image" />
        ) : (
          <RHsupportLight className="feedback-modal__feedback-image" />
        )}
      </FlexItem>
    </Flex>
  );
};

export const createFeedbackModal = createModalLauncher(FeedbackModal, {
  'data-test': 'feedback-modal',
  variant: ModalVariant.large,
  className: 'feedback-modal',
});

export default FeedbackModal;
