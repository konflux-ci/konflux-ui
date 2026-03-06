import * as React from 'react';
import {
  Text,
  TextContent,
  TextVariants,
  Card,
  CardTitle,
  CardBody,
  PanelHeader,
  PanelMain,
  PanelMainBody,
  FlexItem,
  PanelFooter,
  Button,
} from '@patternfly/react-core';
import { FeedbackSections } from '../consts';
import { SubmitClicked } from './FeedbackForm';

interface BeginningSectionProps {
  onSectionChange: (section: FeedbackSections) => void;
  onClose: (event?: KeyboardEvent | React.MouseEvent, submitClicked?: SubmitClicked) => void;
}

const BeginningSection: React.FC<BeginningSectionProps> = ({ onSectionChange, onClose }) => {
  return (
    <>
      <PanelHeader className="feedback-modal__panel-header">
        <FlexItem>
          <TextContent>
            <Text component={TextVariants.h1}>Tell us how we&apos;re doing?</Text>
          </TextContent>
        </FlexItem>
        <FlexItem>
          <TextContent>
            <Text component={TextVariants.small}>Help us make Konflux the bees knees</Text>
          </TextContent>
        </FlexItem>
      </PanelHeader>
      <PanelMain className="feedback-modal__content-main">
        <PanelMainBody className="feedback-modal__cards-list">
          <Card
            isCompact
            isClickable
            className="feedback-modal__section-card"
            onClick={() => onSectionChange(FeedbackSections.FeedbackSection)}
          >
            <CardTitle>
              <TextContent>
                <Text component={TextVariants.p}>Share feedback</Text>
              </TextContent>
            </CardTitle>
            <CardBody>
              <TextContent>
                <Text component={TextVariants.small}>
                  Please share your experience using Konflux to the product team
                </Text>
              </TextContent>
            </CardBody>
          </Card>
          <Card
            isCompact
            isClickable
            className="feedback-modal__section-card"
            onClick={() => onSectionChange(FeedbackSections.BugSection)}
          >
            <CardTitle>
              <TextContent>
                <Text component={TextVariants.p}>Report a bug</Text>
              </TextContent>
            </CardTitle>
            <CardBody>
              <TextContent>
                <Text component={TextVariants.small}>
                  Describe the bug you encountered. For urgent issues, use #konflux-user-forum
                  instead.
                </Text>
              </TextContent>
            </CardBody>
          </Card>

          <Card
            isCompact
            isClickable
            className="feedback-modal__section-card"
            onClick={() => onSectionChange(FeedbackSections.FeatureSection)}
          >
            <CardTitle>
              <TextContent>
                <Text component={TextVariants.p}>Request a new feature</Text>
              </TextContent>
            </CardTitle>
            <CardBody>
              <TextContent>
                <Text component={TextVariants.small}>
                  Share your ideas for new feature to make Konflux even better for all users.
                </Text>
              </TextContent>
            </CardBody>
          </Card>
        </PanelMainBody>
      </PanelMain>
      <PanelFooter className="feedback-modal__panel-footer">
        <Button variant="link" onClick={() => onClose(null, { submitClicked: false })}>
          Cancel
        </Button>
      </PanelFooter>
    </>
  );
};

export default BeginningSection;
