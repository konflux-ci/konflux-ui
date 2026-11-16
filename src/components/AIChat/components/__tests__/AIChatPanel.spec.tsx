import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { AIChatPanel } from '~/components/AIChat/components/AIChatPanel';
import { KONFLUX_AI_DISPLAY_MODE } from '~/components/AIChat/const';

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
  ChatbotDisplayMode: { default: 'default' },
}));

describe('AIChatPanel', () => {
  it('wraps children in Chatbot with the Konflux display mode and visibility', () => {
    render(
      <AIChatPanel isVisible>
        <span>panel body</span>
      </AIChatPanel>,
    );

    const panel = screen.getByTestId('chatbot');
    expect(panel).toHaveAttribute('data-display-mode', KONFLUX_AI_DISPLAY_MODE);
    expect(panel).toHaveAttribute('data-visible', 'true');
    expect(screen.getByText('panel body')).toBeInTheDocument();
  });
});
