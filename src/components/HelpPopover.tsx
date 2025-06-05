import * as React from 'react';
import { Popover, PopoverProps } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';

// The Popover doesn't show inside the Modal by clicking.
// It is becauses Popper.js mark data-popper-reference-hidden as true in Modal.
// And we just have one scenario(import secrets) for this situation.
const HelpPopover: React.FC<React.PropsWithChildren<Omit<PopoverProps, 'children'>>> = (props) => {
  const triggerRef = React.useRef<HTMLSpanElement>(null);
  const [isInsideModal, setIsInsideModal] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (triggerRef.current) {
      const modal =
        triggerRef.current.closest('.pf-v5-c-modal-box') ||
        triggerRef.current.closest('.pf-c-modal-box');
      setIsInsideModal(!!modal);
    }
  }, []);

  // appendTo={() => document.querySelector('.pf-v5-c-modal-box')} do not work for modal
  if (isInsideModal) return null;

  return (
    <Popover {...props}>
      <span
        ref={triggerRef}
        style={{ cursor: 'pointer' }}
        aria-label="help"
        role="button"
        tabIndex={0}
      >
        <OutlinedQuestionCircleIcon />
      </span>
    </Popover>
  );
};

export default HelpPopover;
