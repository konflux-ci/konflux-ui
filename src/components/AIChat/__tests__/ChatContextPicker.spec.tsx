import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { AIChatProvider } from '../AIChatProvider';
import { ChatContextPicker } from '../context/ChatContextPicker';
import { CONTEXT_HOVER_CLASS, CONTEXT_SELECTED_CLASS } from '../context/types';
import { useAIChat } from '../hooks/useAIChat';

jest.mock('~/feature-flags/hooks', () => ({
  useIsOnFeatureFlag: jest.fn(),
  IfFeature: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;

const PickerController: React.FC = () => {
  const { isPickingContext, startContextPick, finishContextPick, selectedContexts } = useAIChat();

  return (
    <div>
      <div data-test="picking">{isPickingContext ? 'picking' : 'idle'}</div>
      <div data-test="selected-count">{selectedContexts.length}</div>
      <div data-test="selected-labels">{selectedContexts.map((context) => context.label).join(',')}</div>
      <button type="button" data-test="start-pick" onClick={startContextPick}>
        Start
      </button>
      <button type="button" data-test="finish-pick" onClick={finishContextPick}>
        Finish
      </button>
      <div
        data-ai-chat-context="true"
        data-ai-chat-context-id="demo-1"
        data-ai-chat-context-label="Demo target one"
        data-test="target-1"
      >
        Demo target one
      </div>
      <div
        data-ai-chat-context="true"
        data-ai-chat-context-id="demo-2"
        data-ai-chat-context-label="Demo target two"
        data-test="target-2"
      >
        Demo target two
      </div>
      <ChatContextPicker />
    </div>
  );
};

describe('ChatContextPicker', () => {
  beforeEach(() => {
    mockUseIsOnFeatureFlag.mockReturnValue(true);
  });

  afterEach(() => {
    mockUseIsOnFeatureFlag.mockReset();
    document.body.classList.remove('ai-chat-context-picking');
  });

  it('highlights target on hover and toggles selection on click', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AIChatProvider>
          <PickerController />
        </AIChatProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('start-pick'));
    expect(screen.getByTestId('picking')).toHaveTextContent('picking');

    const target = screen.getByTestId('target-1');
    await user.hover(target);
    expect(target).toHaveClass(CONTEXT_HOVER_CLASS);

    await user.click(target);
    expect(screen.getByTestId('selected-count')).toHaveTextContent('1');
    expect(screen.getByTestId('selected-labels')).toHaveTextContent('Demo target one');
    expect(target).toHaveClass(CONTEXT_SELECTED_CLASS);
    expect(screen.getByTestId('picking')).toHaveTextContent('picking');

    await user.click(target);
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
    expect(target).not.toHaveClass(CONTEXT_SELECTED_CLASS);
  });

  it('supports selecting multiple targets before finishing', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AIChatProvider>
          <PickerController />
        </AIChatProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('start-pick'));
    await user.click(screen.getByTestId('target-1'));
    await user.click(screen.getByTestId('target-2'));

    expect(screen.getByTestId('selected-count')).toHaveTextContent('2');
    expect(screen.getByTestId('selected-labels')).toHaveTextContent('Demo target one,Demo target two');

    await user.click(screen.getByTestId('finish-pick'));
    expect(screen.getByTestId('picking')).toHaveTextContent('idle');
    expect(screen.getByTestId('selected-count')).toHaveTextContent('2');
  });

  it('cancels picking on Escape', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AIChatProvider>
          <PickerController />
        </AIChatProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('start-pick'));
    await user.keyboard('{Escape}');
    expect(screen.getByTestId('picking')).toHaveTextContent('idle');
  });
});
