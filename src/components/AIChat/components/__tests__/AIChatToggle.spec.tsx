import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChatToggle } from '~/components/AIChat/components/AIChatToggle';
import {
  KONFLUX_AI_TOGGLE_BUTTON_LABEL,
  KONFLUX_AI_TOGGLE_TOOLTIP,
} from '~/components/AIChat/const';

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotToggle', () => ({
  __esModule: true,
  default: ({
    tooltipLabel,
    toggleButtonLabel,
    isChatbotVisible,
    onToggleChatbot,
  }: {
    tooltipLabel: string;
    toggleButtonLabel: string;
    isChatbotVisible: boolean;
    onToggleChatbot: () => void;
  }) => (
    <button
      type="button"
      aria-label={toggleButtonLabel}
      title={tooltipLabel}
      aria-pressed={isChatbotVisible}
      onClick={onToggleChatbot}
    >
      Toggle
    </button>
  ),
}));

describe('AIChatToggle', () => {
  it('passes visibility and labels through to ChatbotToggle', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();

    render(<AIChatToggle isVisible onToggle={onToggle} />);

    const toggle = screen.getByRole('button', { name: KONFLUX_AI_TOGGLE_BUTTON_LABEL });
    expect(toggle).toHaveAttribute('title', KONFLUX_AI_TOGGLE_TOOLTIP);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await user.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
