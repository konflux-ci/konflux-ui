import {
  CONTEXT_ID_ATTR,
  CONTEXT_SELECTED_CLASS,
  CONTEXT_TARGET_ATTR,
} from '~/consts/ai-chat-context';

export const applySelectedHighlight = (element: HTMLElement): void => {
  element.classList.add(CONTEXT_SELECTED_CLASS);
  element.setAttribute('aria-selected', 'true');
};

export const removeSelectedHighlight = (element: HTMLElement): void => {
  element.classList.remove(CONTEXT_SELECTED_CLASS);
  element.removeAttribute('aria-selected');
};

export const clearAllSelectedHighlights = (elements: Iterable<HTMLElement>): void => {
  for (const element of elements) {
    removeSelectedHighlight(element);
  }
};

export const clearAllContextHighlightsInDocument = (): void => {
  document.querySelectorAll(`.${CONTEXT_SELECTED_CLASS}`).forEach((node) => {
    if (node instanceof HTMLElement) {
      removeSelectedHighlight(node);
    }
  });
};

export const syncSelectedHighlights = (selectedIds: ReadonlySet<string>): void => {
  document.querySelectorAll(`[${CONTEXT_TARGET_ATTR}]`).forEach((node) => {
    if (!(node instanceof HTMLElement)) {
      return;
    }

    const id = node.getAttribute(CONTEXT_ID_ATTR);
    if (!id) {
      return;
    }

    if (selectedIds.has(id)) {
      applySelectedHighlight(node);
    } else if (node.classList.contains(CONTEXT_SELECTED_CLASS)) {
      removeSelectedHighlight(node);
    }
  });
};
