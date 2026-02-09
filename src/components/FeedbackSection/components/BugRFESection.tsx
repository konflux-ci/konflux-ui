import * as React from 'react';
import { Stack, StackItem, Text, TextContent, TextVariants, Tooltip } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';
import { CheckboxField, InputField } from 'formik-pf';
import { FeedbackSections } from '../consts';

interface BugRFESectionProps {
  currentSection: FeedbackSections;
}

const BugRFESection: React.FC<BugRFESectionProps> = ({ currentSection }) => {
  return (
    <Stack>
      <StackItem>
        <TextContent>
          <Text component={TextVariants.h1}>
            {currentSection === FeedbackSections.BugSection
              ? 'Report a bug'
              : 'Request a new feature'}
          </Text>
        </TextContent>
      </StackItem>
      <StackItem>
        <TextContent className="feedback-modal__spacer-bottom">
          <Text component={TextVariants.small}>
            {currentSection === FeedbackSections.BugSection
              ? 'Describe the bug you encountered. For urgent issues, use #konflux-user-forum instead'
              : 'Please provide detailed description of the feature'}
          </Text>
        </TextContent>
      </StackItem>
      <StackItem>
        <TextContent className="feedback-modal__input-field">
          <InputField
            name={currentSection === FeedbackSections.BugSection ? 'bug.title' : 'feature.title'}
            label="Title"
            data-test={
              currentSection === FeedbackSections.BugSection ? 'bug-title' : 'feature-title'
            }
            required
          />
        </TextContent>
      </StackItem>
      <StackItem>
        <TextContent className="feedback-modal__input-field feedback-modal__spacer-bottom">
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
        </TextContent>
      </StackItem>
      {currentSection === FeedbackSections.BugSection && (
        <StackItem>
          <CheckboxField
            name="bug.getAdditionalInfo"
            aria-label="get system info"
            label="Include system information (os, architecture, etc)"
          />
        </StackItem>
      )}
    </Stack>
  );
};

export default BugRFESection;
