import * as React from 'react';
import type { IConversation } from '@redhat-cloud-services/ai-client-common';
import {
  useCreateNewConversation,
  useSetActiveConversation,
} from '@redhat-cloud-services/ai-react-state';
import {
  getConversationErrorMessage,
  reportConversationError,
} from '~/components/AIChat/conversation-errors';

export const useAIChatConversationActions = () => {
  const [conversationError, setConversationError] = React.useState<string>();
  const createNewConversation = useCreateNewConversation();
  const setActiveConversation = useSetActiveConversation();

  const clearConversationError = React.useCallback(() => {
    setConversationError(undefined);
  }, []);

  const startNewChat = React.useCallback(async (): Promise<boolean> => {
    setConversationError(undefined);

    try {
      const conversation: IConversation = await createNewConversation();
      await setActiveConversation(conversation.id);
      return true;
    } catch (error) {
      reportConversationError('Failed to start new Lightspeed chat', error);
      setConversationError(getConversationErrorMessage(error));
      return false;
    }
  }, [createNewConversation, setActiveConversation]);

  const selectConversation = React.useCallback(
    async (conversationId: string) => {
      setConversationError(undefined);

      try {
        await setActiveConversation(conversationId);
      } catch (error) {
        reportConversationError('Failed to load Lightspeed conversation', error, {
          conversationId,
        });
        setConversationError(getConversationErrorMessage(error));
      }
    },
    [setActiveConversation],
  );

  return {
    conversationError,
    clearConversationError,
    startNewChat,
    selectConversation,
  };
};
