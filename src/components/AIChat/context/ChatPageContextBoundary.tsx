import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { ChatContextTarget } from './ChatContextTarget';
import { getPageContextId, getPageContextLabel } from './page-context';

type ChatPageContextBoundaryProps = {
  children: React.ReactNode;
};

export const ChatPageContextBoundary: React.FC<ChatPageContextBoundaryProps> = ({ children }) => {
  const { pathname } = useLocation();
  const pageId = getPageContextId(pathname);
  const pageLabel = getPageContextLabel();

  return (
    <ChatContextTarget
      id={pageId}
      label={pageLabel}
      description="Entire current page"
      className="ai-chat-page-context-boundary"
    >
      {children}
    </ChatContextTarget>
  );
};
