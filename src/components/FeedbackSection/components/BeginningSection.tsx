import * as React from 'react';
import {
  Content,
  ContentVariants,
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
import { IfFeature } from '~/feature-flags/hooks';
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
          <Content>
            <Content component={ContentVariants.h1}>Tell us how we&apos;re doing?</Content>
          </Content>
        </FlexItem>
        <FlexItem>
          <Content>
            <Content component={ContentVariants.small}>Help us make Konflux the bees knees</Content>
          </Content>
        </FlexItem>
      </PanelHeader>
      <PanelMain className="feedback-modal__content-main">
        <PanelMainBody className="feedback-modal__cards-list">
          <IfFeature flag="feedback-section">
            <Card
              isCompact
              isClickable
              className="feedback-modal__section-card"
              onClick={() => onSectionChange(FeedbackSections.FeedbackSection)}
            >
              <CardTitle>
                <Content>
                  <Content component={ContentVariants.p}>Share feedback</Content>
                </Content>
              </CardTitle>
              <CardBody>
                <Content>
                  <Content component={ContentVariants.small}>
                    Please share your experience using Konflux to the product team
                  </Content>
                </Content>
              </CardBody>
            </Card>
          </IfFeature>
          <Card
            isCompact
            isClickable
            className="feedback-modal__section-card"
            onClick={() => onSectionChange(FeedbackSections.BugSection)}
          >
            <CardTitle>
              <Content>
                <Content component={ContentVariants.p}>Report a bug</Content>
              </Content>
            </CardTitle>
            <CardBody>
              <Content>
                <Content component={ContentVariants.small}>
                  Describe the bug you encountered. For urgent issues, use #konflux-user-forum
                  instead.
                </Content>
              </Content>
            </CardBody>
          </Card>

          <Card
            isCompact
            isClickable
            className="feedback-modal__section-card"
            onClick={() => onSectionChange(FeedbackSections.FeatureSection)}
          >
            <CardTitle>
              <Content>
                <Content component={ContentVariants.p}>Request a new feature</Content>
              </Content>
            </CardTitle>
            <CardBody>
              <Content>
                <Content component={ContentVariants.small}>
                  Share your ideas for new feature to make Konflux even better for all users.
                </Content>
              </Content>
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
