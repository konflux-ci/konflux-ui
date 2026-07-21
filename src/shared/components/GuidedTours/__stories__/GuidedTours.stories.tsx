import React from 'react';
import { Button, Card, CardBody, CardTitle, PageSection, Title } from '@patternfly/react-core';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { useTour } from '~/shared/components/GuidedTours/hooks/useTour';
import { HighlightStep } from '~/shared/components/GuidedTours/steps/HighlightStep';
import { ModalStep } from '~/shared/components/GuidedTours/steps/ModalStep';
import { SpotlightStep } from '~/shared/components/GuidedTours/steps/SpotlightStep';
import { StepNavigation } from '~/shared/components/GuidedTours/steps/StepNavigation';
import { TourProvider } from '~/shared/components/GuidedTours/TourProvider';
import { TourRenderer } from '~/shared/components/GuidedTours/TourRenderer';
import type { MergedStep } from '~/shared/components/GuidedTours/types';

const meta: Meta = {
  title: 'GuidedTours',
};

export default meta;

type Story = StoryObj;

// --- StepNavigation ---

export const StepNavigationFirstStep: Story = {
  name: 'StepNavigation / First Step',
  render: () => (
    <StepNavigation
      currentStep={0}
      totalSteps={5}
      isFirstStep
      isLastStep={false}
      onNext={fn()}
      onPrev={fn()}
      onDone={fn()}
    />
  ),
};

export const StepNavigationMiddleStep: Story = {
  name: 'StepNavigation / Middle Step',
  render: () => (
    <StepNavigation
      currentStep={2}
      totalSteps={5}
      isFirstStep={false}
      isLastStep={false}
      onNext={fn()}
      onPrev={fn()}
      onDone={fn()}
    />
  ),
};

export const StepNavigationLastStep: Story = {
  name: 'StepNavigation / Last Step',
  render: () => (
    <StepNavigation
      currentStep={4}
      totalSteps={5}
      isFirstStep={false}
      isLastStep
      onNext={fn()}
      onPrev={fn()}
      onDone={fn()}
    />
  ),
};

// --- ModalStep ---

export const Modal: Story = {
  name: 'ModalStep',
  render: () => (
    <ModalStep
      title="Welcome to Konflux"
      content="This guided tour will walk you through the key features of the application."
      currentStep={0}
      totalSteps={3}
      isFirstStep
      isLastStep={false}
      onNext={fn()}
      onPrev={fn()}
      onSkip={fn()}
      onDone={fn()}
    />
  ),
};

// --- SpotlightStep ---

export const Spotlight: Story = {
  name: 'SpotlightStep',
  decorators: [
    (Story) => (
      <div style={{ padding: '80px' }}>
        <Button data-tour="demo-target">Target Button</Button>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <SpotlightStep
      title="Create Application"
      content="Click this button to create your first application."
      target="demo-target"
      position="bottom"
      currentStep={1}
      totalSteps={3}
      isFirstStep={false}
      isLastStep={false}
      onNext={fn()}
      onPrev={fn()}
      onSkip={fn()}
      onDone={fn()}
    />
  ),
};

// --- HighlightStep ---

export const Highlight: Story = {
  name: 'HighlightStep',
  decorators: [
    (Story) => (
      <div style={{ padding: '80px' }}>
        <Card data-tour="demo-card">
          <CardTitle>Application Overview</CardTitle>
          <CardBody>This card shows your application details.</CardBody>
        </Card>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <HighlightStep
      title="Application Details"
      content="This card provides an overview of your application status and configuration."
      target="demo-card"
      position="bottom"
      currentStep={2}
      totalSteps={3}
      isFirstStep={false}
      isLastStep
      onNext={fn()}
      onPrev={fn()}
      onSkip={fn()}
      onDone={fn()}
    />
  ),
};

// --- Full Tour Flow ---

const DEMO_STEPS: MergedStep[] = [
  {
    step: {
      type: 'modal',
      title: 'Welcome to Konflux',
      content: 'This tour will introduce you to the key features of the platform.',
    },
    sourceId: 'demo-tour',
  },
  {
    step: {
      type: 'spotlight',
      title: 'Create Application',
      content: 'Use this button to create a new application.',
      target: 'tour-create-btn',
      position: 'bottom',
    },
    sourceId: 'demo-tour',
  },
  {
    step: {
      type: 'highlight',
      title: 'Application Card',
      content: 'Your applications appear here with status and details.',
      target: 'tour-app-card',
      position: 'bottom',
    },
    sourceId: 'demo-tour',
  },
  {
    step: {
      type: 'modal',
      title: 'Tour Complete',
      content: 'You are all set! Explore the platform at your own pace.',
      closing: true,
    },
    sourceId: 'demo-tour',
  },
];

const DemoPageContent: React.FC = () => {
  const { startTour, isActive } = useTour();

  return (
    <>
      <PageSection>
        <Title headingLevel="h1">My Workspace</Title>
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', alignItems: 'flex-start' }}>
          <Button data-tour="tour-create-btn" variant="primary">
            Create Application
          </Button>
          <Button
            variant="secondary"
            onClick={() => startTour(DEMO_STEPS, ['demo-tour'])}
            isDisabled={isActive}
          >
            Start Tour
          </Button>
        </div>
        <div style={{ marginTop: '24px' }}>
          <Card data-tour="tour-app-card" style={{ maxWidth: '400px' }}>
            <CardTitle>my-app</CardTitle>
            <CardBody>
              <p>Status: Running</p>
              <p>Components: 3</p>
              <p>Last deployed: 2 hours ago</p>
            </CardBody>
          </Card>
        </div>
      </PageSection>
      <TourRenderer />
    </>
  );
};

export const FullTourFlow: Story = {
  name: 'Full Tour Flow',
  decorators: [
    (Story) => (
      <TourProvider>
        <Story />
      </TourProvider>
    ),
  ],
  render: () => <DemoPageContent />,
};
