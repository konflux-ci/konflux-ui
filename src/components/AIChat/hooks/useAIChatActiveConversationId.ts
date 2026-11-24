import { useActiveConversation } from '@redhat-cloud-services/ai-react-state';
import { isTemporaryConversationId } from '~/components/AIChat/conversation-utils';

export const useAIChatActiveConversationId = (): string | null => {
  const activeConversation = useActiveConversation();

  return isTemporaryConversationId(activeConversation?.id)
    ? null
    : (activeConversation?.id ?? null);
};
