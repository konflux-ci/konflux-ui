import * as React from 'react';
import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { withConversationMenuActions } from '~/components/AIChat/conversationActions';
import {
  deleteConversation,
  listConversations,
  updateConversationTopicSummary,
} from '~/components/AIChat/lightspeed-api';
import { filterGroupedConversations, groupConversations } from '~/components/AIChat/utils';
import { logger } from '~/monitoring/logger';

export type RenameConversationTarget = {
  conversationId: string;
  currentName: string;
};

type UseLightspeedConversationHistoryParams = {
  activeConversationIdRef: React.RefObject<string | null>;
  onActiveConversationDeleted: () => void;
  setBackendError: React.Dispatch<React.SetStateAction<string | undefined>>;
};

export type UseLightspeedConversationHistoryResult = {
  conversations: Record<string, Conversation[]> | Conversation[];
  isRenamingConversation: boolean;
  renameConversationTarget: RenameConversationTarget | null;
  refreshConversations: () => Promise<void>;
  filterConversations: (searchValue: string) => void;
  closeRenameConversation: () => void;
  confirmRenameConversation: (newName: string) => Promise<void>;
  abortInFlightListRequest: () => void;
};

export const useLightspeedConversationHistory = ({
  activeConversationIdRef,
  onActiveConversationDeleted,
  setBackendError,
}: UseLightspeedConversationHistoryParams): UseLightspeedConversationHistoryResult => {
  const [allConversations, setAllConversations] = React.useState<Record<string, Conversation[]>>(
    {},
  );
  const [conversations, setConversations] = React.useState<
    Record<string, Conversation[]> | Conversation[]
  >({});
  const [isRenamingConversation, setIsRenamingConversation] = React.useState(false);
  const [renameConversationTarget, setRenameConversationTarget] =
    React.useState<RenameConversationTarget | null>(null);
  const conversationListAbortRef = React.useRef<AbortController | null>(null);

  const abortInFlightListRequest = React.useCallback(() => {
    conversationListAbortRef.current?.abort();
  }, []);

  const refreshConversations = React.useCallback(async () => {
    conversationListAbortRef.current?.abort();
    const abortController = new AbortController();
    conversationListAbortRef.current = abortController;

    try {
      const response = await listConversations(abortController.signal);

      if (abortController.signal.aborted) {
        return;
      }

      const grouped = groupConversations(response.conversations);
      setAllConversations(grouped);
      setConversations(grouped);
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      const message = error instanceof Error ? error.message : 'Failed to load conversations';
      logger.warn('Failed to load Lightspeed conversations', { error: message });
    }
  }, []);

  const filterConversations = React.useCallback(
    (searchValue: string) => {
      setConversations(filterGroupedConversations(allConversations, searchValue));
    },
    [allConversations],
  );

  const deleteConversationById = React.useCallback(
    async (conversationId: string) => {
      try {
        await deleteConversation(conversationId);

        if (activeConversationIdRef.current === conversationId) {
          onActiveConversationDeleted();
        }

        await refreshConversations();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete conversation';
        setBackendError(message);
        logger.warn('Failed to delete Lightspeed conversation', { conversationId, error: message });
      }
    },
    [activeConversationIdRef, onActiveConversationDeleted, refreshConversations, setBackendError],
  );

  const renameConversationById = React.useCallback((conversationId: string, currentName: string) => {
    setRenameConversationTarget({ conversationId, currentName });
  }, []);

  const closeRenameConversation = React.useCallback(() => {
    setRenameConversationTarget(null);
  }, []);

  const confirmRenameConversation = React.useCallback(
    async (newName: string) => {
      if (!renameConversationTarget) {
        return;
      }

      const { conversationId } = renameConversationTarget;
      setIsRenamingConversation(true);
      setBackendError(undefined);

      try {
        await updateConversationTopicSummary(conversationId, { topicSummary: newName });
        await refreshConversations();
        setRenameConversationTarget(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to rename conversation';
        setBackendError(message);
        logger.warn('Failed to rename Lightspeed conversation', { conversationId, error: message });
      } finally {
        setIsRenamingConversation(false);
      }
    },
    [refreshConversations, renameConversationTarget, setBackendError],
  );

  const conversationsWithMenuActions = React.useMemo(
    () =>
      withConversationMenuActions(conversations, {
        onDeleteConversation: (conversationId) => {
          void deleteConversationById(conversationId);
        },
        onRenameConversation: renameConversationById,
      }),
    [conversations, deleteConversationById, renameConversationById],
  );

  return {
    conversations: conversationsWithMenuActions,
    isRenamingConversation,
    renameConversationTarget,
    refreshConversations,
    filterConversations,
    closeRenameConversation,
    confirmRenameConversation,
    abortInFlightListRequest,
  };
};
