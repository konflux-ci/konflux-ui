import * as React from 'react';
import { ClipboardCopyButton } from '@patternfly/react-core';

export interface CopyIconButtonProps {
  text: string;
  tooltip?: string;
}

export const CopyIconButton: React.FC<CopyIconButtonProps> = ({ text, tooltip = "Copy" }) => {
  const [copied, setCopied] = React.useState(false);
  const id = React.useId();

  const handleClick = React.useCallback(() => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
  }, [text]);

  const handleTooltipHidden = React.useCallback(() => {
    setCopied(false);
  }, []);

  return (
    <ClipboardCopyButton
      id={`copy-button-${id}`}
      textId="copy-text"
      onClick={handleClick}
      onTooltipHidden={handleTooltipHidden}
      variant="plain"
      aria-label="Copy to clipboard"
    >
      {copied ? 'Copied' : tooltip}
    </ClipboardCopyButton>
  );
};
