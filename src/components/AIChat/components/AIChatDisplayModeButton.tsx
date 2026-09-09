import * as React from 'react';
import { Button, Icon, Tooltip } from '@patternfly/react-core';
import { CompressIcon } from '@patternfly/react-icons/dist/esm/icons/compress-icon';
import { ExpandIcon } from '@patternfly/react-icons/dist/esm/icons/expand-icon';
import {
  KONFLUX_AI_MAXIMIZE_ARIA_LABEL,
  KONFLUX_AI_MAXIMIZE_TOOLTIP,
  KONFLUX_AI_MINIMIZE_ARIA_LABEL,
  KONFLUX_AI_MINIMIZE_TOOLTIP,
} from '~/components/AIChat/const';

type AIChatDisplayModeButtonProps = {
  isMaximized: boolean;
  onToggle: () => void;
};

export const AIChatDisplayModeButton: React.FC<AIChatDisplayModeButtonProps> = ({
  isMaximized,
  onToggle,
}) => {
  const tooltipContent = isMaximized ? KONFLUX_AI_MINIMIZE_TOOLTIP : KONFLUX_AI_MAXIMIZE_TOOLTIP;
  const menuAriaLabel = isMaximized ? KONFLUX_AI_MINIMIZE_ARIA_LABEL : KONFLUX_AI_MAXIMIZE_ARIA_LABEL;

  return (
    <div className="pf-chatbot__menu">
      <Tooltip content={tooltipContent} position="bottom" aria="none">
        <Button
          className="pf-chatbot__button--toggle-menu"
          variant="plain"
          onClick={onToggle}
          aria-label={menuAriaLabel}
          data-test="ai-chat-display-mode-toggle"
          icon={
            <Icon size="xl" isInline>
              {isMaximized ? <CompressIcon aria-hidden /> : <ExpandIcon aria-hidden />}
            </Icon>
          }
        />
      </Tooltip>
    </div>
  );
};
