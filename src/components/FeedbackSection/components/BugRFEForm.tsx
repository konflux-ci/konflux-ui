import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  ButtonType,
  Checkbox,
  Form,
  FormHelperText,
  FormGroup,
  PanelFooter,
  Text,
  TextInput,
  TextContent,
  TextVariants,
  Tooltip,
  HelperTextItem,
  HelperText,
} from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';
import { FeedbackSections } from '../consts';

interface SubmitValues {
  title: string;
  description: string;
  additionalInfo?: boolean;
}

interface BugRFESectionProps {
  currentSection: FeedbackSections;
  onBack: () => void;
  onClose: () => void;
  onSubmit: (values: SubmitValues) => void;
}

const BugRFESection: React.FC<BugRFESectionProps> = ({
  currentSection,
  onClose,
  onBack,
  onSubmit,
}) => {
  const [additionalInfo, setAdditionalInfo] = React.useState<boolean>(false);
  const [title, setTitle] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const [touched, setTouched] = React.useState<{ title: boolean; description: boolean }>({
    title: false,
    description: false,
  });

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
            {currentSection === FeedbackSections.BugSection ? (
              <>
                Describe the bug you encountered. For urgent issues, use{' '}
                <Link to="#" target="blank">
                  #konflux-user-forum
                </Link>{' '}
                instead
              </>
            ) : (
              'Please provide detailed description of the feature'
            )}
          </Text>
        </TextContent>
      </div>
      <div className="feedback-modal__content-main">
        <Form>
          <FormGroup className="feedback-modal__input-field" label="Title">
            <TextInput
              id="title"
              name="title"
              aria-label="Title"
              label="Title"
              data-test={
                currentSection === FeedbackSections.BugSection ? 'bug-title' : 'feature-title'
              }
              required
              value={title}
              onChange={(_e, val: string) => {
                setTitle(val);
                if (!touched.title) {
                  setTouched({ ...touched, title: true });
                }
              }}
              maxLength={256}
            />
            {touched.title && title.length < 1 && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">Required*</HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          <FormGroup
            className="feedback-modal__input-field"
            label={
              <>
                Please provide detailed description of the bug{' '}
                <Tooltip content="more info">
                  <OutlinedQuestionCircleIcon />
                </Tooltip>
              </>
            }
          >
            <TextInput
              id="description"
              name="description"
              aria-label="Description"
              label="Description"
              data-test={
                currentSection === FeedbackSections.BugSection
                  ? 'bug-description'
                  : 'feature-description'
              }
              required
              value={description}
              onChange={(_e, val: string) => {
                setDescription(val);
                if (!touched.description) {
                  setTouched({ ...touched, description: true });
                }
              }}
            />
            {touched.description && description.length < 1 && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">Required*</HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          {currentSection === FeedbackSections.BugSection && (
            <Checkbox
              id="additionalInfo"
              aria-label="get system info"
              label="Include system information (os, architecture, etc)"
              isChecked={additionalInfo}
              onChange={() => setAdditionalInfo(!additionalInfo)}
            />
          )}
        </Form>
      </div>
      <PanelFooter className="feedback-modal__panel-footer">
        <Button
          variant="primary"
          type={ButtonType.submit}
          onClick={() => {
            onSubmit({
              title,
              description,
              additionalInfo:
                currentSection === FeedbackSections.BugSection ? additionalInfo : undefined,
            });
          }}
          isDisabled={title.length < 1 || description.length < 1}
        >
          Preview on Github
        </Button>
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </PanelFooter>
    </>
  );
};

export default BugRFESection;
