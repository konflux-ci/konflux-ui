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

type UseAIChatConversationListOptions = {
  setConversationError: React.Dispatch<React.SetStateAction<string | undefined>>;
};

export const useAIChatConversationList = ({
  setConversationError,
}: UseAIChatConversationListOptions) => {
  const [allConversations, setAllConversations] = React.useState<Conversation[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [conversationSearch, setConversationSearch] = React.useState('');
  const [isLoadingConversations, setIsLoadingConversations] = React.useState(false);
  const conversationSearchRef = React.useRef(conversationSearch);
  conversationSearchRef.current = conversationSearch;

  const client = useClient<LightspeedClient>();

  const refreshConversations = React.useCallback(async () => {
    setIsLoadingConversations(true);
    setConversationError(undefined);

    try {
      const response = await client.getConversations();
      const historyConversations = toHistoryConversations(
        mapConversationDetails(response.conversations),
      );
      setAllConversations(historyConversations);
      setConversations(
        filterByText(historyConversations, conversationSearchRef.current, (item) => item.text),
      );
    } catch (error) {
      reportConversationError('Failed to load Lightspeed conversations', error);
      setConversationError(getConversationErrorMessage(error));
    } finally {
      setIsLoadingConversations(false);
    }
  }, [client, setConversationError]);

  const filterConversations = React.useCallback(
    (searchValue: string) => {
      setConversationSearch(searchValue);
      setConversations(filterByText(allConversations, searchValue, (item) => item.text));
    },
    [allConversations],
  );

  return {
    conversations,
    hasNoSearchResults: Boolean(conversationSearch.trim()) && conversations.length === 0,
    isLoadingConversations,
    refreshConversations,
    filterConversations,
  };
};
