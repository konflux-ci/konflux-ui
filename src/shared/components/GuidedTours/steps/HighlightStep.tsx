import * as React from 'react';
import { Popover } from '@patternfly/react-core';
import { useTargetElement } from '../hooks/useTargetElement';
import { PopoverPosition } from '../types';
import './HighlightStep.scss';
import { StepNavigation } from './StepNavigation';

interface HighlightStepProps {
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

const HIGHLIGHT_CLASS = 'guided-tours__highlight-ring';

const POSITION_MAP: Record<string, 'top' | 'bottom' | 'left' | 'right' | 'auto'> = {
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  auto: 'auto',
};

export const HighlightStep: React.FC<HighlightStepProps> = ({
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
  const { targetEl } = useTargetElement(target);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  // Add/remove highlight ring class
  React.useEffect(() => {
    if (!targetEl) return undefined;
    targetEl.classList.add(HIGHLIGHT_CLASS);
    return () => {
      targetEl.classList.remove(HIGHLIGHT_CLASS);
    };
  }, [targetEl]);

  triggerRef.current = targetEl;

  if (!targetEl) {
    return null;
  }

  return (
    <Popover
      isVisible
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
      shouldClose={onSkip}
      position={POSITION_MAP[position]}
      triggerRef={triggerRef as React.RefObject<HTMLElement>}
      headerContent={title}
      bodyContent={content}
      appendTo={() => document.querySelector('#hacDev-modal-container') ?? document.body}
      data-test="tour-highlight-step"
    />
  );
};
