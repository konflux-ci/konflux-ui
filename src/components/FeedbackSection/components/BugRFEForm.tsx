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
import { useKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { FeedbackSections } from '../consts';
import { getBugURL, getFeatureURL } from '../feedback-utils';
import { SubmitClicked } from './FeedbackForm';

interface BugRFESectionProps {
  currentSection: FeedbackSections;
  setCurrentSection: (FeedbackSections) => void;
  onClose: (event?: KeyboardEvent | React.MouseEvent, submitClicked?: SubmitClicked) => void;
}

const BugRFESection: React.FC<BugRFESectionProps> = ({
  currentSection,
  onClose,
  setCurrentSection,
}) => {
  const [additionalInfo, setAdditionalInfo] = React.useState<boolean>(false);
  const [title, setTitle] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const [touched, setTouched] = React.useState<{ title: boolean; description: boolean }>({
    title: false,
    description: false,
  });

  const [konfluxInfo] = useKonfluxPublicInfo();

  const handleSubmit = () => {
    if (currentSection === FeedbackSections.BugSection) {
      const bug = { title, description, getAdditionalInfo: additionalInfo };
      const url = getBugURL(bug, konfluxInfo);
      window.open(url, '_blank');
      onClose(null, { submitClicked: true });
    }

    if (currentSection === FeedbackSections.FeatureSection) {
      const feature = { title, description };
      const url = getFeatureURL(feature);
      window.open(url, '_blank');
      onClose(null, { submitClicked: true });
    }
  };
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
              maxLength={65536}
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
          onClick={handleSubmit}
          isDisabled={title.length < 1 || description.length < 1}
        >
          Preview on Github
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

export default BugRFESection;
