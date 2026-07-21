import * as React from 'react';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { StepNavigation } from './StepNavigation';

interface ModalStepProps {
  title: string;
  content: string;
  variant?: 'small' | 'medium';
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onDone: () => void;
}

const VARIANT_MAP = {
  small: ModalVariant.small,
  medium: ModalVariant.medium,
} as const;

export const ModalStep: React.FC<ModalStepProps> = ({
  title,
  content,
  variant = 'small',
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  onNext,
  onPrev,
  onSkip,
  onDone,
}) => (
  <Modal
    isOpen
    variant={VARIANT_MAP[variant]}
    onClose={onSkip}
    data-test="tour-modal-step"
    appendTo={() => document.querySelector('#hacDev-modal-container') ?? document.body}
  >
    <ModalHeader title={title} />
    <ModalBody>
      <p>{content}</p>
    </ModalBody>
    <ModalFooter>
      <StepNavigation
        currentStep={currentStep}
        totalSteps={totalSteps}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        onNext={onNext}
        onPrev={onPrev}
        onDone={onDone}
      />
    </ModalFooter>
  </Modal>
);
