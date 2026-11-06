import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChatHeader } from '~/components/AIChat/components/AIChatHeader';

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
  });
});
