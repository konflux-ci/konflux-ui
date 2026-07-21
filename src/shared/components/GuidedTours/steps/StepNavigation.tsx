import * as React from 'react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onPrev: () => void;
  onDone: () => void;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  onNext,
  onPrev,
  onDone,
}) => (
  <Flex
    alignItems={{ default: 'alignItemsCenter' }}
    justifyContent={{ default: 'justifyContentSpaceBetween' }}
  >
    <FlexItem>
      <span data-test="tour-step-counter">{`${currentStep + 1} of ${totalSteps}`}</span>
    </FlexItem>
    <FlexItem>
      <Flex gap={{ default: 'gapSm' }}>
        {!isFirstStep && (
          <Button variant="secondary" onClick={onPrev} data-test="tour-back-btn" size="sm">
            Back
          </Button>
        )}
        {isLastStep ? (
          <Button variant="primary" onClick={onDone} data-test="tour-done-btn" size="sm">
            Done
          </Button>
        ) : (
          <Button variant="primary" onClick={onNext} data-test="tour-next-btn" size="sm">
            Next
          </Button>
        )}
      </Flex>
    </FlexItem>
  </Flex>
);
