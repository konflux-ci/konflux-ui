import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChatHeader } from '~/components/AIChat/components/AIChatHeader';
import {
  KONFLUX_AI_MAXIMIZE_ARIA_LABEL,
  KONFLUX_AI_MINIMIZE_ARIA_LABEL,
} from '~/components/AIChat/const';

jest.mock('@patternfly/chatbot/dist/dynamic/ChatbotHeader', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <header>{children}</header>,
  ChatbotHeaderMain: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChatbotHeaderTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChatbotHeaderActions: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ChatbotHeaderCloseButton: ({ onClick }: { onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      Close
    </button>
  ),
  ChatbotHeaderMenu: ({
    onMenuToggle,
    'aria-expanded': ariaExpanded,
  }: {
    onMenuToggle: () => void;
    'aria-expanded'?: boolean;
  }) => (
    <button type="button" aria-expanded={ariaExpanded} onClick={onMenuToggle}>
      History
    </button>
  ),
}));

jest.mock('~/assets/konflux-logo.svg', () => ({
  __esModule: true,
  default: ({ 'aria-label': ariaLabel }: { 'aria-label'?: string }) => (
    <svg aria-label={ariaLabel} />
  ),
}));

describe('AIChatHeader', () => {
  it('renders Konflux branding and closes on request', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(<AIChatHeader onClose={onClose} />);

    expect(screen.getByLabelText('Konflux')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'History' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: KONFLUX_AI_MAXIMIZE_ARIA_LABEL }),
    ).not.toBeInTheDocument();
  });

  it('opens conversation history from the header menu', async () => {
    const user = userEvent.setup();
    const onToggleDrawer = jest.fn();

    render(<AIChatHeader isDrawerOpen onClose={jest.fn()} onToggleDrawer={onToggleDrawer} />);

    const historyButton = screen.getByRole('button', { name: 'History' });
    expect(historyButton).toHaveAttribute('aria-expanded', 'true');
    await user.click(historyButton);
    expect(onToggleDrawer).toHaveBeenCalledTimes(1);
  });

  it('toggles display mode from the header', async () => {
    const user = userEvent.setup();
    const onToggleDisplayMode = jest.fn();

    render(
      <AIChatHeader isMaximized onClose={jest.fn()} onToggleDisplayMode={onToggleDisplayMode} />,
    );

    await user.click(screen.getByRole('button', { name: KONFLUX_AI_MINIMIZE_ARIA_LABEL }));

    expect(onToggleDisplayMode).toHaveBeenCalledTimes(1);
  });
});
