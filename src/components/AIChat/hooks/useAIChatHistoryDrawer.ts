import * as React from 'react';

type UseAIChatHistoryDrawerOptions = {
  refreshConversations: () => Promise<void>;
  startNewChat: () => Promise<boolean>;
  selectConversation: (conversationId: string) => Promise<void>;
};

export const useAIChatHistoryDrawer = ({
  refreshConversations,
  startNewChat,
  selectConversation,
}: UseAIChatHistoryDrawerOptions) => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const handleToggleDrawer = React.useCallback(() => {
    if (!isDrawerOpen) {
      void refreshConversations();
    }
    setIsDrawerOpen((open) => !open);
  }, [isDrawerOpen, refreshConversations]);

  const handleNewChat = React.useCallback(() => {
    setIsDrawerOpen(false);
    void startNewChat().then((started) => {
      if (started) {
        void refreshConversations();
      }
    });
  }, [refreshConversations, startNewChat]);

  const handleSelectConversation = React.useCallback(
    (_event: React.MouseEvent | undefined, conversationId?: string | number) => {
      if (conversationId === undefined) {
        return;
      }
      void selectConversation(String(conversationId));
      setIsDrawerOpen(false);
    },
    [selectConversation],
  );

  return {
    isDrawerOpen,
    setIsDrawerOpen,
    handleToggleDrawer,
    handleNewChat,
    handleSelectConversation,
  };
};
