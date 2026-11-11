import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChatDisplayModeButton } from '~/components/AIChat/components/AIChatDisplayModeButton';
import {
  KONFLUX_AI_MAXIMIZE_ARIA_LABEL,
  KONFLUX_AI_MINIMIZE_ARIA_LABEL,
} from '~/components/AIChat/const';

describe('AIChatDisplayModeButton', () => {
  it('offers maximize and calls the toggle', async () => {
    const user = userEvent.setup();
    const onToggle = jest.fn();

    render(<AIChatDisplayModeButton isMaximized={false} onToggle={onToggle} />);

    await user.click(screen.getByRole('button', { name: KONFLUX_AI_MAXIMIZE_ARIA_LABEL }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('offers minimize when the chat is maximized', () => {
    render(<AIChatDisplayModeButton isMaximized onToggle={jest.fn()} />);

    expect(screen.getByRole('button', { name: KONFLUX_AI_MINIMIZE_ARIA_LABEL })).toBeInTheDocument();
  });
});
