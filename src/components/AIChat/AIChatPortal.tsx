import * as React from 'react';
import * as ReactDOM from 'react-dom';

/**
 * Portals the chat onto document.body as an aside labeled "AI Chat".
 * The aside is the complementary landmark and sits outside the app stacking context.
 */
export const AIChatPortal: React.FC<React.PropsWithChildren> = ({ children }) =>
  ReactDOM.createPortal(
    <aside aria-label="AI Chat">{children}</aside>,
    document.body,
  );
