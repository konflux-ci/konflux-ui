import * as React from 'react';
import { Text, TextContent, TextVariants, Tooltip } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';
import { CheckboxField, InputField } from 'formik-pf';
import { FeedbackSections } from '../consts';

interface BugRFESectionProps {
  currentSection: FeedbackSections;
}

const BugRFESection: React.FC<BugRFESectionProps> = ({ currentSection }) => {
  return (
    <>
      <div className="feedback-modal__panel-header">
        <TextContent>
          <Text component={TextVariants.h1}>
            {currentSection === FeedbackSections.BugSection
              ? 'Report a bug'
              : 'Request a new feature'}
          </Text>
        </TextContent>
        <TextContent className="feedback-modal__spacer-bottom">
          <Text component={TextVariants.small}>
            {currentSection === FeedbackSections.BugSection
              ? 'Describe the bug you encountered. For urgent issues, use #konflux-user-forum instead'
              : 'Please provide detailed description of the feature'}
          </Text>
        </TextContent>
      </div>
      <div className="feedback-modal__content-main">
        <div className="feedback-modal__input-field">
          <InputField
            name={currentSection === FeedbackSections.BugSection ? 'bug.title' : 'feature.title'}
            label="Title"
            data-test={
              currentSection === FeedbackSections.BugSection ? 'bug-title' : 'feature-title'
            }
            required
          />
        </div>
        <div className="feedback-modal__input-field">
          <InputField
            name={
              currentSection === FeedbackSections.BugSection
                ? 'bug.description'
                : 'feature.description'
            }
            label={
              <>
                Please provide detailed description of the bug{' '}
                <Tooltip content="more info">
                  <OutlinedQuestionCircleIcon />
                </Tooltip>
              </>
            }
            data-test={
              currentSection === FeedbackSections.BugSection
                ? 'bug-description'
                : 'feature-description'
            }
            required
          />
        </div>
        {currentSection === FeedbackSections.BugSection && (
          <CheckboxField
            name="bug.getAdditionalInfo"
            aria-label="get system info"
            label="Include system information (os, architecture, etc)"
          />
        )}
      </div>
    </>
  );
};

export default BugRFESection;
