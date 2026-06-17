import {
  AI_CHAT_DOCK_CLASS,
  CONTEXT_DESCRIPTION_ATTR,
  CONTEXT_ID_ATTR,
  CONTEXT_LABEL_ATTR,
  CONTEXT_PARENT_ID_ATTR,
  CONTEXT_TARGET_ATTR,
  ChatContextSelection,
} from './types';

export const findNearestContextTarget = (element: EventTarget | null): HTMLElement | null => {
  if (!(element instanceof Element)) {
    return null;
  }
  const target = element.closest(`[${CONTEXT_TARGET_ATTR}]`);
  return target instanceof HTMLElement ? target : null;
};

const isInsideAIChatUI = (element: Element): boolean =>
  !!element.closest(`.${AI_CHAT_DOCK_CLASS}`);

export const findContextTargetAtPoint = (
  x: number,
  y: number,
  fallbackElement?: EventTarget | null,
): HTMLElement | null => {
  if (fallbackElement instanceof Element && isInsideAIChatUI(fallbackElement)) {
    return null;
  }

  if (typeof document.elementsFromPoint !== 'function') {
    return findNearestContextTarget(fallbackElement ?? null);
  }

  const elements = document.elementsFromPoint(x, y);
  for (const element of elements) {
    if (!(element instanceof Element)) {
      continue;
    }
    if (isInsideAIChatUI(element)) {
      return null;
    }
    const target = element.closest(`[${CONTEXT_TARGET_ATTR}]`);
    if (target instanceof HTMLElement) {
      return target;
    }
  }

  return findNearestContextTarget(fallbackElement ?? null);
};

export const parseContextTarget = (
  element: HTMLElement,
  route: string,
): ChatContextSelection | null => {
  const id = element.getAttribute(CONTEXT_ID_ATTR);
  const label = element.getAttribute(CONTEXT_LABEL_ATTR);
  if (!id || !label) {
    return null;
  }
  const description = element.getAttribute(CONTEXT_DESCRIPTION_ATTR) ?? undefined;
  const parentContextId = element.getAttribute(CONTEXT_PARENT_ID_ATTR) ?? undefined;
  return {
    id,
    label,
    description,
    route,
    ...(parentContextId ? { metadata: { parentContextId } } : {}),
  };
};
