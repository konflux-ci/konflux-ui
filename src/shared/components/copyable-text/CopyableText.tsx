import * as React from 'react';
import { Button, ButtonVariant, Tooltip } from '@patternfly/react-core';
import CopyIcon from '@patternfly/react-icons/dist/esm/icons/copy-icon';

type CopyableTextProps = {
  text: string;
  'data-test'?: string;
};

/**
 * CopyableText component displays text with a copy button
 * Used for displaying image URLs that should be copied instead of clicked
 */
export const CopyableText: React.FC<CopyableTextProps> = ({ text, 'data-test': dataTest }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <span data-test={dataTest} style={{ wordBreak: 'break-all' }}>
      <span data-test={`${dataTest}-text`}>{text}</span>{' '}
      <Tooltip content={copied ? 'Copied!' : 'Copy to clipboard'}>
        <Button
          variant={ButtonVariant.plain}
          onClick={handleCopy}
          icon={<CopyIcon />}
          aria-label="Copy to clipboard"
          data-test={`${dataTest}-copy-button`}
          style={{
            padding: '0',
            minWidth: 'auto',
            height: 'auto',
            verticalAlign: 'middle',
            display: 'inline',
          }}
        />
      </Tooltip>
    </span>
  );
};
