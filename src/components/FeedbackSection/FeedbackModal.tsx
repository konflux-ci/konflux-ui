import * as React from 'react';
import { ModalVariant, Flex, FlexItem, Bullseye, Spinner, Panel } from '@patternfly/react-core';
import { ErrorBoundary } from '@sentry/react';
import { ComponentProps, createModalLauncher } from '~/components/modal/createModalLauncher';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { THEME_DARK, useTheme } from '~/shared';
import RHsupportDark from '../../assets/rh_feedback--dark.svg';
import RHsupportLight from '../../assets/rh_feedback.svg';
import BeginningSection from './components/BeginningSection';
import { FeedbackValues } from './components/FeedbackForm';
import { FeedbackSections } from './consts';
import { getBugURL, getFeatureURL } from './feedback-utils';
import './FeedbackModal.scss';

const BugRFESection = React.lazy(() => import('./components/BugRFEForm'));
const FeedbackSection = React.lazy(() => import('./components/FeedbackForm'));

export interface SubmitClicked {
  submitClicked: boolean;
}

const FeedbackModal: React.FC<React.PropsWithChildren<ComponentProps>> = ({ onClose }) => {
  const [currentSection, setCurrentSection] = React.useState<FeedbackSections>(
    FeedbackSections.BeginningSection,
  );
  const { effectiveTheme } = useTheme();

  const onCancel = () => {
    onClose(null, { submitClicked: false });
  };

  const onBack = () => {
    setCurrentSection(FeedbackSections.BeginningSection);
  };
  const [konfluxInfo] = useKonfluxPublicInfo();

  const handleBugFeatureSubmit = React.useCallback(
    (values: { description: string; title: string; additionalInfo?: boolean }) => {
      if (currentSection === FeedbackSections.BugSection) {
        const { description, title, additionalInfo = false } = values;
        const url = getBugURL(
          { description, title, getAdditionalInfo: additionalInfo },
          konfluxInfo,
        );
        window.open(url, '_blank');
        onClose(null, { submitClicked: true });
      }

      if (currentSection === FeedbackSections.FeatureSection) {
        const url = getFeatureURL(values);
        window.open(url, '_blank');
        onClose(null, { submitClicked: true });
      }
    },
    [currentSection, konfluxInfo, onClose],
  );

  const handleFeedbackSubmit = (values: FeedbackValues) => {
    // eslint-disable-next-line no-console
    console.log(values);
    // segment integration to go here
    onClose(null, { submitClicked: true });
  };

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
                <BeginningSection onSectionChange={setCurrentSection} onClose={onCancel} />
              )}
              {currentSection === FeedbackSections.FeedbackSection && (
                <FeedbackSection
                  onClose={onCancel}
                  onBack={onBack}
                  onSubmit={handleFeedbackSubmit}
                />
              )}
              {currentSection === FeedbackSections.BugSection && (
                <BugRFESection
                  currentSection={FeedbackSections.BugSection}
                  onClose={onCancel}
                  onBack={onBack}
                  onSubmit={handleBugFeatureSubmit}
                />
              )}
              {currentSection === FeedbackSections.FeatureSection && (
                <BugRFESection
                  currentSection={FeedbackSections.FeatureSection}
                  onClose={onCancel}
                  onBack={onBack}
                  onSubmit={handleBugFeatureSubmit}
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
