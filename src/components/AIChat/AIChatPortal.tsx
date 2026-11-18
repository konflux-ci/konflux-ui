import * as React from 'react';
import * as ReactDOM from 'react-dom';

const KONFLUX_AI_CHAT_PORTAL_ID = 'konflux-ai-chat';

/** Portal node the rename modal appends into, falling back to document.body. */
export const getAIChatPortalContainer = (): HTMLElement =>
  document.getElementById(KONFLUX_AI_CHAT_PORTAL_ID) ?? document.body;

/**
 * Portals the chat onto document.body as an aside labeled "AI Chat".
 * The aside is the complementary landmark and sits outside the app stacking context.
 */
export const AIChatPortal: React.FC<React.PropsWithChildren> = ({ children }) =>
  ReactDOM.createPortal(
    <aside id={KONFLUX_AI_CHAT_PORTAL_ID} aria-label="AI Chat">
      {children}
    </aside>,
    document.body,
  );
