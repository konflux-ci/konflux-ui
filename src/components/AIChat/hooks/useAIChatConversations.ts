import * as React from 'react';
import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import type { IConversation } from '@redhat-cloud-services/ai-client-common';
import {
  useActiveConversation,
  useClient,
  useCreateNewConversation,
  useSetActiveConversation,
} from '@redhat-cloud-services/ai-react-state';
import type { LightspeedClient } from '@redhat-cloud-services/lightspeed-client';
import {
  getConversationErrorMessage,
  reportConversationError,
} from '~/components/AIChat/conversation-errors';
import {
  isTemporaryConversationId,
  mapConversationDetails,
} from '~/components/AIChat/conversation-utils';
import { toHistoryConversations } from '~/components/AIChat/message-utils';
import { filterByText } from '~/utils/text-filter-utils';

type UseAIChatConversationsResult = {
  activeConversationId: string | null;
  conversations: Conversation[];
  conversationError?: string;
  hasNoSearchResults: boolean;
  isLoadingConversations: boolean;
  refreshConversations: () => Promise<void>;
  startNewChat: () => Promise<boolean>;
  selectConversation: (conversationId: string) => Promise<void>;
  filterConversations: (searchValue: string) => void;
};

export const useAIChatConversations = (): UseAIChatConversationsResult => {
  const [allConversations, setAllConversations] = React.useState<Conversation[]>([]);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [conversationSearch, setConversationSearch] = React.useState('');
  const [conversationError, setConversationError] = React.useState<string>();
  const [isLoadingConversations, setIsLoadingConversations] = React.useState(false);
  const conversationSearchRef = React.useRef(conversationSearch);
  conversationSearchRef.current = conversationSearch;

  const client = useClient<LightspeedClient>();
  const activeConversation = useActiveConversation();
  const createNewConversation = useCreateNewConversation();
  const setActiveConversation = useSetActiveConversation();

  const activeConversationId = isTemporaryConversationId(activeConversation?.id)
    ? null
    : (activeConversation?.id ?? null);

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
  }, [client]);

  const filterConversations = React.useCallback(
    (searchValue: string) => {
      setConversationSearch(searchValue);
      setConversations(filterByText(allConversations, searchValue, (item) => item.text));
    },
    [allConversations],
  );

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
    activeConversationId,
    conversations,
    conversationError,
    hasNoSearchResults: Boolean(conversationSearch.trim()) && conversations.length === 0,
    isLoadingConversations,
    refreshConversations,
    startNewChat,
    selectConversation,
    filterConversations,
  };
};
