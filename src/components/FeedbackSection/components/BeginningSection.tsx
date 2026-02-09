import * as React from 'react';
import {
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  Card,
  CardTitle,
  CardBody,
} from '@patternfly/react-core';
import { FeedbackSections } from '../consts';

interface BeginningSectionProps {
  setCurrentSection: (section: FeedbackSections) => void;
}

const BeginningSection: React.FC<BeginningSectionProps> = ({ setCurrentSection }) => {
  return (
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Text component={TextVariants.h1}>Tell us how we&apos;re doing?</Text>
        </TextContent>
      </StackItem>
      <StackItem>
        <TextContent>
          <Text component={TextVariants.small}>Help us make Konflux the bees knees</Text>
        </TextContent>
      </StackItem>
      <StackItem className="feedback-modal__card-container">
        <Card
          className="feedback-modal__card-container-card"
          onClick={() => setCurrentSection(FeedbackSections.FeedbackSection)}
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
      </StackItem>
      <StackItem>
        <Card
          className="feedback-modal__card-container-card"
          onClick={() => setCurrentSection(FeedbackSections.BugSection)}
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
      </StackItem>
      <StackItem>
        <Card
          className="feedback-modal__card-container-card"
          onClick={() => setCurrentSection(FeedbackSections.FeatureSection)}
        >
          <CardTitle>
            <TextContent>
              <Text component={TextVariants.p}>Request a new feature</Text>
            </TextContent>
          </CardTitle>
          <CardBody>
            <TextContent>
              <Text component={TextVariants.small}>
                Share yout ideas for new feature to make Konflux even better for all users.
              </Text>
            </TextContent>
          </CardBody>
        </Card>
      </StackItem>
    </Stack>
  );
};

export default BeginningSection;
