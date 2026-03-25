import * as React from 'react';
import {
  Button,
  ButtonType,
  Form,
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

export interface SubmitClicked {
  submitClicked: boolean;
}

export interface FeedbackValues {
  description: string;
  scale: number;
  email?: string;
}

export interface FeedbackSectionProps {
  onBack: () => void;
  onClose: () => void;
  onSubmit: (values: FeedbackValues) => void;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ onClose, onBack, onSubmit }) => {
  const [radioRating, setRadioRating] = React.useState<number>(null);
  const [feedback, setFeedback] = React.useState<string>('');
  const [ratingError, setRatingError] = React.useState(false);
  const [email, setEmail] = React.useState<string>('');

  const setRating = (value: number) => {
    setRadioRating(value);
    setRatingError(false);
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
      <Form
        className="feedback-modal__form"
        onSubmit={(e: React.FormEvent) => {
          e.preventDefault();
          if (radioRating == null) {
            setRatingError(true);
            return;
          }
          onSubmit({ description: feedback, scale: radioRating, email });
        }}
      >
        <div className="feedback-modal__content-main">
          <FormGroup
            isRequired
            label={
              <>
                How happy are you with recent experience using Konflux
                <TextContent>
                  <Text component={TextVariants.p}>
                    Please rate using the following scale, 5 - very satisfied to 1 - very
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
              onChange={() => setRating(5)}
              label="5"
              id="radio-rating"
            />
            <Radio
              isChecked={radioRating === 4}
              name="radio-rating-4"
              data-test="radio-rating-4"
              onChange={() => setRating(4)}
              label="4"
              id="radio-rating"
            />
            <Radio
              isChecked={radioRating === 3}
              name="radio-rating-3"
              data-test="radio-rating-3"
              onChange={() => setRating(3)}
              label="3"
              id="radio-rating"
            />
            <Radio
              isChecked={radioRating === 2}
              name="radio-rating-2"
              data-test="radio-rating-2"
              onChange={() => setRating(2)}
              label="2"
              id="radio-rating"
            />
            <Radio
              isChecked={radioRating === 1}
              name="radio-rating-1"
              data-test="radio-rating-1"
              onChange={() => setRating(1)}
              label="1"
              id="radio-rating"
            />
            {ratingError && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">Please select a rating</HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>

          <FormGroup className="feedback-modal__input-field" label="Share your feedback">
            <TextInput
              id="feedback"
              name="feedback"
              data-test="feedback-description"
              value={feedback}
              onChange={(_e, val: string) => setFeedback(val)}
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant="default">This is optional</HelperTextItem>
              </HelperText>
            </FormHelperText>
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
        </div>
        <PanelFooter className="feedback-modal__panel-footer">
          <Button
            variant="primary"
            type={ButtonType.submit}
            isDisabled={!radioRating || ratingError}
          >
            Submit feedback
          </Button>
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button variant="link" onClick={onClose}>
            Cancel
          </Button>
        </PanelFooter>
      </Form>
    </>
  );
};

export default FeedbackSection;
