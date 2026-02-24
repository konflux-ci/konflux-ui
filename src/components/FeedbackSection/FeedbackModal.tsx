import * as React from 'react';
import {
  ModalVariant,
  Flex,
  FlexItem,
  Bullseye,
  Spinner,
  Button,
  ButtonType,
  Panel,
  PanelFooter,
} from '@patternfly/react-core';
import { ErrorBoundary } from '@sentry/react';
import { Formik, Form } from 'formik';
import { isEmpty } from 'lodash-es';
import { ComponentProps, createModalLauncher } from '~/components/modal/createModalLauncher';
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { THEME_DARK, useTheme } from '~/shared';
import RHsupportDark from '../../assets/rh_feedback--dark.svg';
import RHsupportLight from '../../assets/rh_feedback.svg';
import BeginningSection from './components/BeginningSection';
import { FeedbackSections } from './consts';
import { BugInfo, FeatureInfo, getBugURL, getFeatureURL } from './feedback-utils';
import {
  BugSectionValidationSchema,
  FeatureSectionValidationSchema,
  FeedbackSectionValidationSchema,
} from './FeedbackValidationSchemas';

const BugRFESection = React.lazy(() => import('./components/BugRFESection'));
const FeedbackSection = React.lazy(() => import('./components/FeedbackSection'));

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
  const [konfluxInfo] = useKonfluxPublicInfo();

  const handleSubmit = (values: { bug?: BugInfo; feature?: FeatureInfo }) => {
    if (currentSection === FeedbackSections.BugSection) {
      const { bug } = values;
      const url = getBugURL(bug, konfluxInfo);
      window.open(url, '_blank');
      onClose(null, { submitClicked: true });
    }

    if (currentSection === FeedbackSections.FeatureSection) {
      const { feature } = values;
      const url = getFeatureURL(feature);
      window.open(url, '_blank');
      onClose(null, { submitClicked: true });
    }
    if (currentSection === FeedbackSections.FeedbackSection) {
      // Add Sentry/Segment connection here
      onClose(null, { submitClicked: true });
    }
  };

  return (
    <Formik
      initialValues={
        currentSection === FeedbackSections.BugSection
          ? {
              bug: { title: '', description: '', getAdditionalInfo: false },
            }
          : currentSection === FeedbackSections.FeatureSection
            ? {
                feature: { title: '', description: '' },
              }
            : {
                feedback: {
                  description: '',
                  scale: 5,
                },
              }
      }
      onSubmit={handleSubmit}
      validationSchema={
        currentSection === FeedbackSections.BugSection
          ? BugSectionValidationSchema
          : currentSection === FeedbackSections.FeatureSection
            ? FeatureSectionValidationSchema
            : FeedbackSectionValidationSchema
      }
    >
      {({ isSubmitting, errors, touched }) => {
        return (
          <Form>
            <Flex
              className="feedback-modal__feedback-flex"
              direction={{ default: 'row' }}
              alignItems={{ default: 'alignItemsStretch' }}
            >
              <FlexItem
                className="feedback-modal__feedback-description"
                flex={{ default: 'flex_2' }}
              >
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
                        <BeginningSection setCurrentSection={setCurrentSection} />
                      )}
                      {currentSection === FeedbackSections.FeedbackSection && <FeedbackSection />}
                      {currentSection === FeedbackSections.BugSection && (
                        <BugRFESection currentSection={FeedbackSections.BugSection} />
                      )}
                      {currentSection === FeedbackSections.FeatureSection && (
                        <BugRFESection currentSection={FeedbackSections.FeatureSection} />
                      )}
                    </React.Suspense>
                  </ErrorBoundary>

                  <PanelFooter className="feedback-modal__panel-footer">
                    {(currentSection === FeedbackSections.BugSection ||
                      currentSection === FeedbackSections.FeatureSection) && (
                      <Button
                        variant="primary"
                        type={ButtonType.submit}
                        isDisabled={isEmpty(touched) || !isEmpty(errors) || isSubmitting}
                      >
                        Preview on Github
                      </Button>
                    )}
                    {currentSection === FeedbackSections.FeedbackSection && (
                      <Button
                        variant="primary"
                        type={ButtonType.submit}
                        isDisabled={isEmpty(touched) || !isEmpty(errors) || isSubmitting}
                      >
                        Submit feedback
                      </Button>
                    )}
                    {currentSection !== FeedbackSections.BeginningSection && (
                      <Button
                        variant="secondary"
                        onClick={() => setCurrentSection(FeedbackSections.BeginningSection)}
                      >
                        Back
                      </Button>
                    )}
                    <Button variant="link" onClick={() => onClose(null, { submitClicked: false })}>
                      Cancel
                    </Button>
                  </PanelFooter>
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
          </Form>
        );
      }}
    </Formik>
  );
};

export const createFeedbackModal = createModalLauncher(FeedbackModal, {
  'data-test': 'feedback-modal',
  variant: ModalVariant.large,
  className: 'feedback-modal',
});

export default FeedbackModal;
