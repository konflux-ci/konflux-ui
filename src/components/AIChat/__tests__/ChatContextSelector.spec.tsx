import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { AIChatProvider } from '../AIChatProvider';
import { ChatContextSelector } from '../components/ChatContextSelector';
import { useAIChat } from '../hooks/useAIChat';

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;

const SelectorHarness: React.FC = () => {
  const { toggleContextSelection } = useAIChat();

  return (
    <>
      <button
        type="button"
        data-test="select"
        onClick={() => {
          const element = document.querySelector('[data-test="target"]');
          if (element instanceof HTMLElement) {
            toggleContextSelection(
              {
                id: 'demo-target',
                label: 'Demo target',
                route: '/ns/apps/yolo/snapshots',
              },
              element,
            );
          }
        }}
      >
        Select
      </button>
      <ChatContextSelector />
    </>
  );
};

describe('ChatContextSelector', () => {
  beforeEach(() => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
  });

  afterEach(() => {
    mockUseIsOnFeatureFlag.mockReset();
    document.body.innerHTML = '';
  });

  it('renders context actions with distinct buttons', () => {
    render(
      <MemoryRouter initialEntries={['/ns/apps/yolo/snapshots']}>
        <AIChatProvider>
          <ChatContextSelector />
        </AIChatProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('ai-chat-context-pick')).toBeInTheDocument();
    expect(screen.getByTestId('ai-chat-context-page')).toBeInTheDocument();
    expect(screen.getByTestId('ai-chat-context-clear')).toBeDisabled();
  });

  it('clears all selected context', async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `
      <div
        data-ai-chat-context="true"
        data-ai-chat-context-id="demo-target"
        data-ai-chat-context-label="Demo target"
        data-test="target"
      >
        Target
      </div>
    `;

    render(
      <MemoryRouter initialEntries={['/ns/apps/yolo/snapshots']}>
        <AIChatProvider>
          <SelectorHarness />
        </AIChatProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('select'));
    expect(screen.getByTestId('ai-chat-context-clear')).toBeEnabled();
    await user.click(screen.getByTestId('ai-chat-context-clear'));
    expect(screen.getByTestId('ai-chat-context-clear')).toBeDisabled();
  });

  it('collapses and expands the selected context chips', async () => {
    const user = userEvent.setup();
    document.body.innerHTML = `
      <div
        data-ai-chat-context="true"
        data-ai-chat-context-id="demo-target"
        data-ai-chat-context-label="Demo target"
        data-test="target"
      >
        Target
      </div>
    `;

    render(
      <MemoryRouter initialEntries={['/ns/apps/yolo/snapshots']}>
        <AIChatProvider>
          <SelectorHarness />
        </AIChatProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('select'));
    expect(screen.getByTestId('ai-chat-context-chips')).toBeInTheDocument();

    await user.click(screen.getByTestId('ai-chat-context-chips-toggle'));
    expect(screen.queryByTestId('ai-chat-context-chips')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('ai-chat-context-chips-toggle'));
    expect(screen.getByTestId('ai-chat-context-chips')).toBeInTheDocument();
  });
});
