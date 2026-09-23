import * as React from 'react';
import * as ReactDOM from 'react-dom';

const AI_CHAT_PORTAL_ID = 'konflux-ai-chat-container';

export const getAIChatPortalContainer = (): HTMLElement =>
  document.getElementById(AI_CHAT_PORTAL_ID) ?? document.body;

const createPortalContainer = (): HTMLElement => {
  const container = document.createElement('div');
  container.id = AI_CHAT_PORTAL_ID;
  return container;
};

export const AIChatPortal: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const existing = document.getElementById(AI_CHAT_PORTAL_ID);
    const portalContainer = existing ?? createPortalContainer();
    const isOwner = !existing;

    if (!portalContainer.isConnected) {
      document.body.appendChild(portalContainer);
    }

    setContainer(portalContainer);

    return () => {
      if (isOwner && portalContainer.parentNode) {
        portalContainer.parentNode.removeChild(portalContainer);
      }
      setContainer(null);
    };
  }, []);

  if (!container?.isConnected) {
    return null;
  }

  return ReactDOM.createPortal(children, container);
};
