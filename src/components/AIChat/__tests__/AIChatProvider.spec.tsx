import { MemoryRouter, Route, Routes, Link } from 'react-router-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { AIChatProvider } from '../AIChatProvider';
import { CONTEXT_SELECTED_CLASS } from '../context/types';
import { useAIChat } from '../hooks/useAIChat';

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
}));

const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;

const TestConsumer: React.FC = () => {
  const {
    selectedContexts,
    isPickingContext,
    sendMessage,
    messages,
    startContextPick,
    toggleContextSelection,
    removeContext,
    clearContext,
  } = useAIChat();

  return (
    <div>
      <div data-test="picking">{isPickingContext ? 'picking' : 'idle'}</div>
      <div data-test="context-count">{selectedContexts.length}</div>
      <div data-test="message-count">{messages.length}</div>
      <button type="button" data-test="send" onClick={() => sendMessage('Hello')}>
        Send
      </button>
      <button type="button" data-test="pick" onClick={startContextPick}>
        Pick
      </button>
      <Link to="/other" data-test="navigate">
        Navigate
      </Link>
      <button type="button" data-test="clear" onClick={clearContext}>
        Clear
      </button>
      <button type="button" data-test="remove-first" onClick={() => removeContext('target-id')}>
        Remove first
      </button>
      <button
        type="button"
        data-test="select"
        onClick={() => {
          const element = document.querySelector('[data-test="target"]');
          if (!element || !(element instanceof HTMLElement)) {
            return;
          }
          toggleContextSelection(
            {
              id: 'target-id',
              label: 'Target label',
              route: '/initial',
            },
            element,
          );
        }}
      >
        Select
      </button>
    </div>
  );
};

const renderProvider = (initialPath = '/initial') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AIChatProvider>
        <Routes>
          <Route path="/initial" element={<TestConsumer />} />
          <Route path="/other" element={<TestConsumer />} />
        </Routes>
        <div
          data-ai-chat-context="true"
          data-ai-chat-context-id="target-id"
          data-ai-chat-context-label="Target label"
          data-test="target"
        >
          Target
        </div>
      </AIChatProvider>
    </MemoryRouter>,
  );

describe('AIChatProvider', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockUseIsOnFeatureFlag.mockReturnValue(true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    mockUseIsOnFeatureFlag.mockReset();
  });

  it('sendMessage adds user and mock bot messages', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderProvider();

    await user.click(screen.getByTestId('send'));
    expect(screen.getByTestId('message-count')).toHaveTextContent('1');

    act(() => {
      jest.advanceTimersByTime(700);
    });

    expect(screen.getByTestId('message-count')).toHaveTextContent('2');
  });

  it('toggleContextSelection stores selection and applies selected class', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderProvider();

    await user.click(screen.getByTestId('select'));
    expect(screen.getByTestId('context-count')).toHaveTextContent('1');
    expect(screen.getByTestId('target')).toHaveClass(CONTEXT_SELECTED_CLASS);

    await user.click(screen.getByTestId('select'));
    expect(screen.getByTestId('context-count')).toHaveTextContent('0');
    expect(screen.getByTestId('target')).not.toHaveClass(CONTEXT_SELECTED_CLASS);
  });

  it('removeContext removes one selection highlight', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderProvider();

    await user.click(screen.getByTestId('select'));
    await user.click(screen.getByTestId('remove-first'));
    expect(screen.getByTestId('context-count')).toHaveTextContent('0');
    expect(screen.getByTestId('target')).not.toHaveClass(CONTEXT_SELECTED_CLASS);
  });

  it('clearContext removes all selection highlights', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderProvider();

    await user.click(screen.getByTestId('select'));
    await user.click(screen.getByTestId('clear'));
    expect(screen.getByTestId('context-count')).toHaveTextContent('0');
    expect(screen.getByTestId('target')).not.toHaveClass(CONTEXT_SELECTED_CLASS);
  });

  it('startContextPick enables picking mode', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderProvider();

    await user.click(screen.getByTestId('pick'));
    expect(screen.getByTestId('picking')).toHaveTextContent('picking');
  });

  it('keeps selected contexts when navigating to another route', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderProvider();

    await user.click(screen.getByTestId('select'));
    expect(screen.getByTestId('context-count')).toHaveTextContent('1');

    await user.click(screen.getByTestId('navigate'));
    expect(screen.getByTestId('context-count')).toHaveTextContent('1');
    expect(screen.getByTestId('picking')).toHaveTextContent('idle');
  });
});
