import * as React from 'react';
import { STEP_TYPES } from './consts';
import { HighlightStep } from './steps/HighlightStep';
import { ModalStep } from './steps/ModalStep';
import { SpotlightStep } from './steps/SpotlightStep';
import { useTour } from './useTour';

export const TourRenderer: React.FC = () => {
  const {
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    isFirstStep,
    isLastStep,
    next,
    prev,
    skip,
    done,
  } = useTour();

  if (!isActive || !currentStep) {
    return null;
  }

  const commonProps = {
    currentStep: currentStepIndex,
    totalSteps,
    isFirstStep,
    isLastStep,
    onNext: next,
    onPrev: prev,
    onSkip: skip,
    onDone: done,
  };

  switch (currentStep.type) {
    case STEP_TYPES.MODAL:
      return (
        <ModalStep
          title={currentStep.title}
          content={currentStep.content}
          variant={currentStep.variant}
          {...commonProps}
        />
      );
    case STEP_TYPES.SPOTLIGHT:
      return (
        <SpotlightStep
          title={currentStep.title}
          content={currentStep.content}
          target={currentStep.target}
          position={currentStep.position}
          {...commonProps}
        />
      );
    case STEP_TYPES.HIGHLIGHT:
      return (
        <HighlightStep
          title={currentStep.title}
          content={currentStep.content}
          target={currentStep.target}
          position={currentStep.position}
          {...commonProps}
        />
      );
    default:
      return null;
  }
};
