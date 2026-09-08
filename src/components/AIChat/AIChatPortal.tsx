import * as React from 'react';
import * as ReactDOM from 'react-dom';

const AI_CHAT_PORTAL_ID = 'konflux-ai-chat-container';

const getOrCreatePortalContainer = (): HTMLElement => {
  const existing = document.getElementById(AI_CHAT_PORTAL_ID);
  if (existing) {
    return existing;
  }

  const container = document.createElement('div');
  container.id = AI_CHAT_PORTAL_ID;
  document.body.appendChild(container);
  return container;
};

export const AIChatPortal: React.FC<React.PropsWithChildren> = ({ children }) => {
  const containerRef = React.useRef<HTMLElement | null>(null);

  if (!containerRef.current?.isConnected) {
    containerRef.current = getOrCreatePortalContainer();
  }

  return ReactDOM.createPortal(children, containerRef.current);
};
