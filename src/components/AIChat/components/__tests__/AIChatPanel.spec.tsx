import * as React from 'react';
import { ChatbotDisplayMode } from '@patternfly/chatbot/dist/dynamic/Chatbot';
import { render, screen } from '@testing-library/react';
import { AIChatPanel } from '~/components/AIChat/components/AIChatPanel';
import { KONFLUX_AI_DEFAULT_DISPLAY_MODE } from '~/components/AIChat/const';

jest.mock('@patternfly/chatbot/dist/dynamic/Chatbot', () => ({
  __esModule: true,
  default: ({
    children,
    displayMode,
    isVisible,
  }: {
    children: React.ReactNode;
    displayMode: string;
    isVisible: boolean;
  }) => (
    <div data-test="chatbot" data-display-mode={displayMode} data-visible={String(isVisible)}>
      {children}
    </div>
  ),
  ChatbotDisplayMode: { default: 'default', fullscreen: 'fullscreen' },
}));

describe('AIChatPanel', () => {
  it('wraps children in Chatbot with the Konflux display mode and visibility', () => {
    render(
      <AIChatPanel isVisible>
        <span>panel body</span>
      </AIChatPanel>,
    );

    const panel = screen.getByTestId('chatbot');
    expect(panel).toHaveAttribute('data-display-mode', KONFLUX_AI_DEFAULT_DISPLAY_MODE);
    expect(panel).toHaveAttribute('data-visible', 'true');
    expect(screen.getByText('panel body')).toBeInTheDocument();
  });

  it('forwards fullscreen while the panel is hidden', () => {
    render(
      <AIChatPanel displayMode={ChatbotDisplayMode.fullscreen} isVisible={false}>
        <span>panel body</span>
      </AIChatPanel>,
    );

    const panel = screen.getByTestId('chatbot');
    expect(panel).toHaveAttribute('data-display-mode', ChatbotDisplayMode.fullscreen);
    expect(panel).toHaveAttribute('data-visible', 'false');
  });
});
