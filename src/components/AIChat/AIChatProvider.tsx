import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { ChatContextHighlightSync } from './context/ChatContextHighlightSync';
import { clearAllContextHighlightsInDocument } from './context/highlight';
import { buildPageContextSelection, findPageContextElement } from './context/page-context';
import { applyNestedContextSelectionRules } from './context/selection';
import { ChatContextSelection, ChatMessage } from './context/types';

type AIChatContextValue = {
  isOpen: boolean;
  isEnabled: boolean;
  messages: ChatMessage[];
  selectedContexts: ChatContextSelection[];
  isPickingContext: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  sendMessage: (message: string) => void;
  startContextPick: () => void;
  finishContextPick: () => void;
  cancelContextPick: () => void;
  toggleContextSelection: (selection: ChatContextSelection, element: HTMLElement) => void;
  removeContext: (id: string) => void;
  clearContext: () => void;
  toggleCurrentPageContext: () => void;
};

export const AIChatContext = React.createContext<AIChatContextValue | null>(null);

const MOCK_REPLY_DELAY_MS = 600;

const createMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const formatTimestamp = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const buildMockReply = (userMessage: string, contexts: ChatContextSelection[]): string => {
  if (contexts.length > 0) {
    const labels = contexts.map((context) => `"${context.label}"`).join(', ');
    return `I can help with ${labels}. You asked: "${userMessage}"\n\nThis is a mock response — backend integration is not wired yet.`;
  }
  return `Thanks for your message! You asked: "${userMessage}"\n\nThis is a mock response — backend integration is not wired yet.`;
};

export const AIChatProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const isEnabled = useIsOnFeatureFlag('ai-chat');
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [selectedContexts, setSelectedContexts] = React.useState<ChatContextSelection[]>([]);
  const [isPickingContext, setIsPickingContext] = React.useState(false);
  const mockReplyTimeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  const clearContext = React.useCallback(() => {
    setSelectedContexts([]);
  }, []);

  React.useEffect(() => {
    setIsPickingContext(false);
  }, [pathname]);

  React.useEffect(
    () => () => {
      if (mockReplyTimeoutRef.current) {
        clearTimeout(mockReplyTimeoutRef.current);
      }
      clearAllContextHighlightsInDocument();
    },
    [],
  );

  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), []);
  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);

  const startContextPick = React.useCallback(() => {
    setIsPickingContext(true);
  }, []);

  const finishContextPick = React.useCallback(() => {
    setIsPickingContext(false);
  }, []);

  const cancelContextPick = React.useCallback(() => {
    setIsPickingContext(false);
  }, []);

  const removeContext = React.useCallback((id: string) => {
    setSelectedContexts((prev) => prev.filter((context) => context.id !== id));
  }, []);

  const toggleContextSelection = React.useCallback(
    (selection: ChatContextSelection, element: HTMLElement) => {
      setSelectedContexts((prev) => {
        const isSelected = prev.some((context) => context.id === selection.id);
        return applyNestedContextSelectionRules(prev, selection, element, !isSelected);
      });
    },
    [],
  );

  const toggleCurrentPageContext = React.useCallback(() => {
    const element = findPageContextElement(pathname);
    if (!element) {
      return;
    }
    const selection = buildPageContextSelection(pathname);
    toggleContextSelection(selection, element);
  }, [pathname, toggleContextSelection]);

  const sendMessage = React.useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) {
        return;
      }

      const contextSnapshot = selectedContexts.length > 0 ? [...selectedContexts] : undefined;
      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: 'user',
        content: trimmed,
        contexts: contextSnapshot,
        timestamp: formatTimestamp(),
      };

      setMessages((prev) => [...prev, userMessage]);

      if (mockReplyTimeoutRef.current) {
        clearTimeout(mockReplyTimeoutRef.current);
      }

      mockReplyTimeoutRef.current = setTimeout(() => {
        const botMessage: ChatMessage = {
          id: createMessageId(),
          role: 'bot',
          content: buildMockReply(trimmed, contextSnapshot ?? []),
          timestamp: formatTimestamp(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }, MOCK_REPLY_DELAY_MS);
    },
    [selectedContexts],
  );

  const value = React.useMemo<AIChatContextValue>(
    () => ({
      isOpen,
      isEnabled,
      messages,
      selectedContexts,
      isPickingContext,
      toggle,
      open,
      close,
      sendMessage,
      startContextPick,
      finishContextPick,
      cancelContextPick,
      toggleContextSelection,
      removeContext,
      clearContext,
      toggleCurrentPageContext,
    }),
    [
      isOpen,
      isEnabled,
      messages,
      selectedContexts,
      isPickingContext,
      toggle,
      open,
      close,
      sendMessage,
      startContextPick,
      finishContextPick,
      cancelContextPick,
      toggleContextSelection,
      removeContext,
      clearContext,
      toggleCurrentPageContext,
    ],
  );

  return (
    <AIChatContext.Provider value={value}>
      {isEnabled ? <ChatContextHighlightSync selectedContexts={selectedContexts} /> : null}
      {children}
    </AIChatContext.Provider>
  );
};
