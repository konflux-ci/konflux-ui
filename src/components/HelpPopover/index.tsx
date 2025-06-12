import * as React from 'react';
import { Popover, PopoverProps } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';
import './HelpPopover.scss';

type Props = React.PropsWithChildren<Omit<PopoverProps, 'children'>>;

const HelpPopover: React.FC<Props> = (props) => {
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

  return (
    <Popover
      {...props}
      className={isInsideModal ? 'make-popover-visible-inside-modal' : undefined}
      data-test="help-popover"
    >
      <span
        style={{ cursor: 'pointer' }}
        aria-label="help"
        role="button"
        tabIndex={0}
        ref={triggerRef}
      >
        <OutlinedQuestionCircleIcon />
      </span>
    </Popover>
  );
};

export default HelpPopover;
