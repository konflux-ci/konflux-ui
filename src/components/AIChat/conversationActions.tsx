import type { Conversation } from '@patternfly/chatbot/dist/dynamic/ChatbotConversationHistoryNav';
import { DropdownItem, DropdownList } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { TrashIcon } from '@patternfly/react-icons/dist/esm/icons/trash-icon';

const NO_RESULTS_CONVERSATION_ID = 'no-results';

type ConversationActionHandlers = {
  onDeleteConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, currentName: string) => void;
};

const createConversationMenuItems = (
  conversation: Conversation,
  handlers: ConversationActionHandlers,
) => (
  <DropdownList>
    <DropdownItem
      icon={<PencilAltIcon aria-hidden />}
      onClick={(event) => {
        event.stopPropagation();
        handlers.onRenameConversation(conversation.id, conversation.text);
      }}
    >
      Rename
    </DropdownItem>
    <DropdownItem
      icon={<TrashIcon aria-hidden />}
      onClick={(event) => {
        event.stopPropagation();
        handlers.onDeleteConversation(conversation.id);
      }}
    >
      Delete
    </DropdownItem>
  </DropdownList>
);

const withConversationActions = (
  conversation: Conversation,
  handlers: ConversationActionHandlers,
): Conversation => ({
  ...conversation,
  label: 'Conversation options',
  menuItems: createConversationMenuItems(conversation, handlers),
});

export const withConversationMenuActions = (
  conversations: Record<string, Conversation[]> | Conversation[],
  handlers: ConversationActionHandlers,
): Record<string, Conversation[]> | Conversation[] => {
  if (Array.isArray(conversations)) {
    if (
      conversations.length === 1 &&
      conversations[0]?.id === NO_RESULTS_CONVERSATION_ID
    ) {
      return conversations;
    }

    return conversations.map((conversation) =>
      withConversationActions(conversation, handlers),
    );
  }

  return Object.fromEntries(
    Object.entries(conversations).map(([group, items]) => [
      group,
      items.map((conversation) => withConversationActions(conversation, handlers)),
    ]),
  );
};
