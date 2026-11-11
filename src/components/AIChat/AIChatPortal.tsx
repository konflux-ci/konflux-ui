import * as React from 'react';
import * as ReactDOM from 'react-dom';

/** Renders the chat on document.body so it escapes the app stacking context. */
export const AIChatPortal: React.FC<React.PropsWithChildren> = ({ children }) =>
  ReactDOM.createPortal(
    <div role="complementary" aria-label="AI Chat">
      {children}
    </div>,
    document.body,
  );
