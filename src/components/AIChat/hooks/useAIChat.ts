import * as React from 'react';
import { AIChatContext } from '../AIChatProvider';

export const useAIChat = () => {
  const context = React.useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
};
