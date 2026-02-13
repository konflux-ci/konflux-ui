import * as React from 'react';
import { Text, TextContent, TextVariants } from '@patternfly/react-core';
import { InputField, RadioGroupField } from 'formik-pf';
import HelpPopover from '../../HelpPopover';

const FeedbackSection: React.FC = () => {
  return (
    <>
      <div className="feedback-modal__panel-header">
        <TextContent>
          <Text component={TextVariants.h1}>Share feedback</Text>
        </TextContent>

        <TextContent className="feedback-modal__spacer-bottom">
          <Text component={TextVariants.small}>
            Please share your experience using Konflux directly to the product team
          </Text>
        </TextContent>
      </div>
      <div className="feedback-modal__content-main">
        <RadioGroupField
          name="feedback.feedbackScale"
          label={
            <>
              <b>
                How haapy are you with recent experience using Konflux{' '}
                <HelpPopover headerContent="More info" bodyContent="more info" />
              </b>
              <TextContent>
                <Text component={TextVariants.p}>
                  Please rate using the following scale, 5 - very sattisfied to 1 - very
                  dissatisfied.
                </Text>
              </TextContent>
            </>
          }
          options={[
            {
              value: 5,
              label: '5',
            },
            {
              value: 4,
              label: '4',
            },
            {
              value: 3,
              label: '3',
            },
            {
              value: 2,
              label: '2',
            },
            {
              value: 1,
              label: '1',
            },
          ]}
        />

        <TextContent className="feedback-modal__input-field">
          <InputField
            name="feedback.description"
            label={<b>Share your feedback *</b>}
            data-test="bug-description"
            required
          />
        </TextContent>

        <TextContent className="feedback-modal__input-field">
          <InputField
            name="feedback.email"
            label={<b>Email</b>}
            data-test="bug-description"
            helperText="This is optional"
          />
        </TextContent>
      </div>
    </>
  );
};

export default FeedbackSection;
