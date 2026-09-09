import * as React from 'react';
import { Popover } from '@patternfly/react-core';
import { POSITION_MAP } from '../consts';
import { useTargetElement } from '../hooks/useTargetElement';
import { PopoverPosition } from '../types';
import { SpotlightOverlay } from './SpotlightOverlay';
import { StepNavigation } from './StepNavigation';

interface SpotlightStepProps {
  title: string;
  content: string;
  target: string;
  position?: PopoverPosition;
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onDone: () => void;
}

export const SpotlightStep: React.FC<SpotlightStepProps> = ({
  title,
  content,
  target,
  position = 'auto',
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  onNext,
  onPrev,
  onSkip,
  onDone,
}) => {
  const { targetEl, targetRect, triggerRef } = useTargetElement(target);

  if (!targetEl || !targetRect) {
    return null;
  }

  return (
    <>
      <SpotlightOverlay targetRect={targetRect} />
      <Popover
        isVisible
        shouldClose={onSkip}
        footerContent={
          <StepNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            onNext={onNext}
            onPrev={onPrev}
            onDone={onDone}
          />
        }
        position={POSITION_MAP[position]}
        triggerRef={triggerRef}
        headerContent={title}
        bodyContent={content}
        appendTo={() => document.querySelector('#hacDev-modal-container') ?? document.body}
        data-test="tour-spotlight-step"
      />
    </>
  );
};
