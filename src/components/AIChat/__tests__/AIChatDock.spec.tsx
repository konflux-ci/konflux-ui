import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AIChatDock from '~/components/AIChat/AIChatDock';

const mockUseAIChatInit = jest.fn();
const mockUseAIChatSend = jest.fn();
const mockUseInProgress = jest.fn();

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  AIStateProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useInProgress: () => mockUseInProgress(),
}));

jest.mock('~/components/AIChat/hooks/useAIChatInit', () => ({
  useAIChatInit: () => mockUseAIChatInit(),
}));

jest.mock('~/components/AIChat/hooks/useAIChatSend', () => ({
  useAIChatSend: () => mockUseAIChatSend(),
}));

jest.mock('~/components/AIChat/components/AIChatToggle', () => ({
  AIChatToggle: ({ onToggle }: { onToggle: () => void }) => (
    <button type="button" onClick={onToggle}>
      Toggle chat
    </button>
  ),
}));

jest.mock('~/components/AIChat/components/AIChatPanel', () => ({
  AIChatPanel: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('~/components/AIChat/components/AIChatHeader', () => ({
  AIChatHeader: () => null,
}));

jest.mock('~/components/AIChat/components/AIChatMessageList', () => ({
  AIChatMessageList: () => null,
}));

jest.mock('~/components/AIChat/components/AIChatFooter', () => ({
  AIChatFooter: () => null,
}));

describe('AIChatDock', () => {
  const clearSendError = jest.fn();
  const retryInit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInProgress.mockReturnValue(false);
    mockUseAIChatSend.mockReturnValue({
      sendError: undefined,
      clearSendError,
      sendMessage: jest.fn(),
    });
  });

  it('does not retry initialization when opening a healthy chat panel', async () => {
    const user = userEvent.setup();
    mockUseAIChatInit.mockReturnValue({
      initError: undefined,
      isInitializing: false,
      retryInit,
    });

    render(<AIChatDock />);
    await user.click(screen.getByRole('button', { name: 'Toggle chat' }));

    expect(clearSendError).toHaveBeenCalledTimes(1);
    expect(retryInit).not.toHaveBeenCalled();
  });

  it('retries initialization when opening after an initialization error', async () => {
    const user = userEvent.setup();
    mockUseAIChatInit.mockReturnValue({
      initError: 'Initialization failed',
      isInitializing: false,
      retryInit,
    });

    render(<AIChatDock />);
    await user.click(screen.getByRole('button', { name: 'Toggle chat' }));

    expect(retryInit).toHaveBeenCalledTimes(1);
  });
});
