import * as React from 'react';
import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { useClient } from '@redhat-cloud-services/ai-react-state';
import type { LightspeedClient } from '@redhat-cloud-services/lightspeed-client';
import {
  getConversationErrorMessage,
  reportConversationError,
} from '~/components/AIChat/conversation-errors';
import { mapConversationDetails } from '~/components/AIChat/conversation-utils';
import { toHistoryConversations } from '~/components/AIChat/message-utils';
import { filterByText } from '~/utils/text-filter-utils';

export const useAIChatConversationList = () => {
  const [allConversations, setAllConversations] = React.useState<Conversation[]>([]);
  const [conversationSearch, setConversationSearch] = React.useState('');
  const [conversationError, setConversationError] = React.useState<string>();
  const [isLoadingConversations, setIsLoadingConversations] = React.useState(false);
  const refreshGenerationRef = React.useRef(0);

  const client = useClient<LightspeedClient>();

  const conversations = React.useMemo(
    () => filterByText(allConversations, conversationSearch, (item) => item.text),
    [allConversations, conversationSearch],
  );

  const clearConversationError = React.useCallback(() => {
    setConversationError(undefined);
  }, []);

  const refreshConversations = React.useCallback(async () => {
    const refreshGeneration = refreshGenerationRef.current + 1;
    refreshGenerationRef.current = refreshGeneration;
    setIsLoadingConversations(true);
    setConversationError(undefined);

    try {
      const response = await client.getConversations();
      if (refreshGeneration !== refreshGenerationRef.current) {
        return;
      }
      setAllConversations(toHistoryConversations(mapConversationDetails(response.conversations)));
    } catch (error) {
      if (refreshGeneration !== refreshGenerationRef.current) {
        return;
      }
      reportConversationError('Failed to load Lightspeed conversations', error);
      setConversationError(getConversationErrorMessage(error));
    } finally {
      if (refreshGeneration === refreshGenerationRef.current) {
        setIsLoadingConversations(false);
      }
    }
  }, [client]);

  const filterConversations = React.useCallback((searchValue: string) => {
    setConversationSearch(searchValue);
  }, []);

  return {
    conversations,
    conversationError,
    hasNoSearchResults: Boolean(conversationSearch.trim()) && conversations.length === 0,
    isLoadingConversations,
    clearConversationError,
    refreshConversations,
    filterConversations,
  };
};
