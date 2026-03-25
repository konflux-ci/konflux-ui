import * as React from 'react';
import { Link } from 'react-router-dom';
import { 
  ModalVariant, 
  Flex, 
  FlexItem, 
  Panel,
  Alert,
  AlertGroup,
  AlertActionCloseButton
} from '@patternfly/react-core';
import { ComponentProps, createModalLauncher } from '~/components/modal/createModalLauncher';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { THEME_DARK, useTheme } from '~/shared';
import { lazyLoad, LazyLoadArguments } from '~/shared/components/lazy-load/lazy';
import { StatusBox } from '~/shared/components/status-box/StatusBox';
import RHsupportDark from '../../assets/rh_feedback--dark.svg';
import RHsupportLight from '../../assets/rh_feedback.svg';
import BeginningSection from './components/BeginningSection';
import { BugRFESectionProps } from './components/BugRFEForm';
import { FeedbackSectionProps, FeedbackValues } from './components/FeedbackForm';
import { FeedbackSections } from './consts';
import { getBugURL, getFeatureURL } from './feedback-utils';
import './FeedbackModal.scss';

const FeedbackSection = lazyLoad<FeedbackSectionProps & LazyLoadArguments>(
  () => import('./components/FeedbackForm'),
);
const BugRFEForm = lazyLoad<BugRFESectionProps & LazyLoadArguments>(
  () => import('./components/BugRFEForm'),
);

export interface SubmitClicked {
  submitClicked: boolean;
}

const FeedbackModal: React.FC<React.PropsWithChildren<ComponentProps>> = ({ onClose }) => {
  const [currentSection, setCurrentSection] = React.useState<FeedbackSections>(
    FeedbackSections.BeginningSection,
  );
  const [showToast, setShowToast] = React.useState(false);
  const { effectiveTheme } = useTheme();

  const onCancel = () => {
    onClose(null, { submitClicked: false });
  };

  const onBack = () => {
    setCurrentSection(FeedbackSections.BeginningSection);
  };
  const [konfluxInfo] = useKonfluxPublicInfo();

  const handleBugSubmit = React.useCallback(
    (values: { description: string; title: string; additionalInfo?: boolean }) => {
      const { description, title, additionalInfo = false } = values;
      const url = getBugURL({ description, title, getAdditionalInfo: additionalInfo }, konfluxInfo);
      window.open(url, '_blank');
      onClose(null, { submitClicked: true });
    },
    [konfluxInfo, onClose],
  );

  const handleFeatureSubmit = React.useCallback(
    (values: { description: string; title: string }) => {
      const url = getFeatureURL(values);
      window.open(url, '_blank');
      onClose(null, { submitClicked: true });
    },
    [onClose],
  );

  const handleFeedbackSubmit = (values: FeedbackValues) => {
    // eslint-disable-next-line no-console
    console.log(values);
    // segment integration to go here
    setShowToast(true);
  };

  return (
    <>
      {showToast && (
        <AlertGroup isToast>
          <Alert
            variant="warning"
            title="Feedback submission temporarily disabled"
            actionClose={<AlertActionCloseButton onClose={() => setShowToast(false)} />}
          >
            The feedback system is undergoing maintenance. Your feedback has been logged locally in your browser console but not sent.
          </Alert>
        </AlertGroup>
      )}
      <Flex
        className="feedback-modal__feedback-flex"
        direction={{ default: 'row' }}
        alignItems={{ default: 'alignItemsStretch' }}
      >
      <FlexItem className="feedback-modal__feedback-description" flex={{ default: 'flex_2' }}>
        <Panel isScrollable className="feedback-modal__panel-content">
          {currentSection === FeedbackSections.BeginningSection && (
            <BeginningSection onSectionChange={setCurrentSection} onClose={onCancel} />
          )}
          {currentSection === FeedbackSections.FeedbackSection && (
            <FeedbackSection
              errorFallback={<StatusBox loadError="Couldn't load feedback form" />}
              onClose={onCancel}
              onBack={onBack}
              onSubmit={handleFeedbackSubmit}
            />
          )}
          {currentSection === FeedbackSections.BugSection && (
            <BugRFEForm
              errorFallback={<StatusBox loadError="Couldn't load bug form" />}
              heading="Report a bug"
              onClose={onCancel}
              onBack={onBack}
              onSubmit={handleBugSubmit}
              description={
                <>
                  Describe the bug you encountered. For urgent issues, use{' '}
                  <Link
                    to="https://redhat.enterprise.slack.com/archives/C04PZ7H0VA8"
                    target="blank"
                  >
                    #konflux-user-forum
                  </Link>{' '}
                  instead
                </>
              }
              isAdditionalInfo
            />
          )}
          {currentSection === FeedbackSections.FeatureSection && (
            <BugRFEForm
              errorFallback={<StatusBox loadError="Couldn't load feature form" />}
              onClose={onCancel}
              onBack={onBack}
              heading="Request a new feature"
              description="Please provide detailed description of the feature"
              onSubmit={handleFeatureSubmit}
            />
          )}
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
    </>
  );
};

export const createFeedbackModal = createModalLauncher(FeedbackModal, {
  'data-test': 'feedback-modal',
  variant: ModalVariant.large,
  className: 'feedback-modal',
});

export default FeedbackModal;
