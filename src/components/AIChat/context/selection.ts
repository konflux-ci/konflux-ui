import { CONTEXT_ID_ATTR, CONTEXT_TARGET_ATTR } from '~/consts/ai-chat-context';
import { ChatContextSelection } from './types';

export const getDescendantContextIds = (element: HTMLElement): Set<string> => {
  const ids = new Set<string>();

  element.querySelectorAll(`[${CONTEXT_TARGET_ATTR}]`).forEach((node) => {
    if (!(node instanceof HTMLElement) || node === element) {
      return;
    }
    const id = node.getAttribute(CONTEXT_ID_ATTR);
    if (id) {
      ids.add(id);
    }
  });

  return ids;
};

export const getAncestorContextIds = (element: HTMLElement): Set<string> => {
  const ids = new Set<string>();
  let current: Element | null = element.parentElement;

  while (current) {
    if (current instanceof HTMLElement && current.hasAttribute(CONTEXT_TARGET_ATTR)) {
      const id = current.getAttribute(CONTEXT_ID_ATTR);
      if (id) {
        ids.add(id);
      }
    }
    current = current.parentElement;
  }

  return ids;
};

export const applyNestedContextSelectionRules = (
  previous: ChatContextSelection[],
  selection: ChatContextSelection,
  element: HTMLElement,
  isAdding: boolean,
): ChatContextSelection[] => {
  if (!isAdding) {
    return previous.filter((context) => context.id !== selection.id);
  }

  const descendantIds = getDescendantContextIds(element);
  const ancestorIds = getAncestorContextIds(element);

  const filtered = previous.filter((context) => {
    if (context.id === selection.id) {
      return false;
    }
    if (descendantIds.has(context.id)) {
      return false;
    }
    if (ancestorIds.has(context.id)) {
      return false;
    }
    if (context.metadata?.parentContextId === selection.id) {
      return false;
    }
    return true;
  });

  return [...filtered, selection];
};
