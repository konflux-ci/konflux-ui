export type ChatContextSelection = {
  id: string;
  label: string;
  description?: string;
  route: string;
  metadata?: Record<string, string>;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  content: string;
  contexts?: ChatContextSelection[];
  timestamp: string;
};

export {
  CONTEXT_TARGET_ATTR,
  CONTEXT_ID_ATTR,
  CONTEXT_LABEL_ATTR,
  CONTEXT_DESCRIPTION_ATTR,
  CONTEXT_PARENT_ID_ATTR,
  CONTEXT_HOVER_CLASS,
  CONTEXT_SELECTED_CLASS,
  CONTEXT_PICKING_BODY_CLASS,
  CONTEXT_TARGET_CLASS,
  AI_CHAT_DOCK_CLASS,
} from '~/consts/ai-chat-context';
