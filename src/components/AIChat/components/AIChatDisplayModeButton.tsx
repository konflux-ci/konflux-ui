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

/**
 * Matches the header action chrome from `ChatbotHeaderCloseButton` in
 * `@patternfly/chatbot` ^6.6.0 (`package.json`). That package has no public
 * display-mode action, and its close and menu buttons hardcode their icons,
 * so these internal classes are copied here. Revisit them when chatbot is upgraded.
 */
export const AIChatDisplayModeButton: React.FC<AIChatDisplayModeButtonProps> = ({
  isMaximized,
  onToggle,
}) => {
  const tooltipContent = isMaximized ? KONFLUX_AI_MINIMIZE_TOOLTIP : KONFLUX_AI_MAXIMIZE_TOOLTIP;
  const buttonAriaLabel = isMaximized
    ? KONFLUX_AI_MINIMIZE_ARIA_LABEL
    : KONFLUX_AI_MAXIMIZE_ARIA_LABEL;

  return (
    <div className="pf-chatbot__menu">
      <Tooltip content={tooltipContent} position="bottom" aria="none">
        <Button
          className="pf-chatbot__button--toggle-menu"
          variant="plain"
          onClick={onToggle}
          aria-label={buttonAriaLabel}
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
