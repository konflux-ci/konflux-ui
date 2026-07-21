import * as React from 'react';
import { Popover } from '@patternfly/react-core';
import { SpotlightOverlay } from '../SpotlightOverlay';
import { PopoverPosition } from '../types';
import { useTargetElement } from '../useTargetElement';
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

const POSITION_MAP: Record<string, 'top' | 'bottom' | 'left' | 'right' | 'auto'> = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  auto: 'auto',
};

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
  const { targetEl, targetRect } = useTargetElement(target);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  triggerRef.current = targetEl;

  if (!targetEl || !targetRect) {
    return null;
  }

  return (
    <>
      <SpotlightOverlay targetRect={targetRect} />
      <Popover
        isVisible
        shouldClose={onSkip}
        position={POSITION_MAP[position]}
        triggerRef={triggerRef as React.RefObject<HTMLElement>}
        headerContent={title}
        bodyContent={
          <>
            <p>{content}</p>
            <StepNavigation
              currentStep={currentStep}
              totalSteps={totalSteps}
              isFirstStep={isFirstStep}
              isLastStep={isLastStep}
              onNext={onNext}
              onPrev={onPrev}
              onDone={onDone}
            />
          </>
        }
        appendTo={() => document.querySelector('#hacDev-modal-container') ?? document.body}
        data-test="tour-spotlight-step"
      />
    </>
  );
};
