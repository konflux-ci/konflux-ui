import * as React from 'react';
import {
  Button,
  ButtonType,
  FormGroup,
  PanelFooter,
  Text,
  TextContent,
  TextInput,
  TextVariants,
  Radio,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import HelpPopover from '../../HelpPopover';
import { FeedbackSections } from '../consts';
import { Form } from 'react-router-dom';

interface FeedbackSectionProps {
  setCurrentSection: (FeedbackSections) => void;
  onClose: any;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ onClose, setCurrentSection }) => {
  const [radioRating, setRadioRating] = React.useState<number>(null);
  const [feedback, setFeedback] = React.useState<string>('');
  const [feedbackTouched, setFeedbackTouched] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>('');

  const handleSubmit = () => {
    console.log('data to be posted to Segment API', { radioRating, feedback, email });
    onClose(null, { submitClicked: true });
  };
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
        <Form>
          <FormGroup
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
          >
            <Radio
              isChecked={radioRating === 5}
              name="radio-rating-5"
              data-test="radio-rating-5"
              onChange={() => setRadioRating(5)}
              label="5"
              id="radio-rating"
            />
            <Radio
              isChecked={radioRating === 4}
              name="radio-rating-4"
              data-test="radio-rating-4"
              onChange={() => setRadioRating(4)}
              label="4"
              id="radio-rating"
            />
            <Radio
              isChecked={radioRating === 3}
              name="radio-rating-3"
              data-test="radio-rating-3"
              onChange={() => setRadioRating(3)}
              label="3"
              id="radio-rating"
            />
            <Radio
              isChecked={radioRating === 2}
              name="radio-rating-2"
              data-test="radio-rating-2"
              onChange={() => setRadioRating(2)}
              label="2"
              id="radio-rating"
            />
            <Radio
              isChecked={radioRating === 1}
              name="radio-rating-1"
              data-test="radio-rating-1"
              onChange={() => setRadioRating(1)}
              label="1"
              id="radio-rating"
            />
          </FormGroup>

          <FormGroup className="feedback-modal__input-field" label={<b>Share your feedback *</b>}>
            <TextInput
              id="feedback"
              name="feedback"
              data-test="feedback-description"
              required
              value={feedback}
              onChange={(_e, val: string) => {
                setFeedback(val);
                if (!feedbackTouched) {
                  setFeedbackTouched(true);
                }
              }}
            />
            {feedbackTouched && feedback.length < 1 && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">Required</HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          <FormGroup className="feedback-modal__input-field" label={<b>Email</b>}>
            <TextInput
              id="email"
              name="email"
              data-test="feedback-email"
              value={email}
              onChange={(_e, val: string) => {
                setEmail(val);
              }}
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant="default">This is optional</HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </Form>
      </div>
      <PanelFooter className="feedback-modal__panel-footer">
        <Button
          variant="primary"
          type={ButtonType.submit}
          onClick={handleSubmit}
          isDisabled={feedback.length < 1}
        >
          Submit feedback
        </Button>
        <Button
          variant="secondary"
          onClick={() => setCurrentSection(FeedbackSections.BeginningSection)}
        >
          Back
        </Button>
        <Button variant="link" onClick={() => onClose(null, { submitClicked: false })}>
          Cancel
        </Button>
      </PanelFooter>
    </>
  );
};

export default FeedbackSection;
