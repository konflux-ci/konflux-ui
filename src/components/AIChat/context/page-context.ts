import { CONTEXT_ID_ATTR } from '~/consts/ai-chat-context';
import { sanitizeContextId } from '~/utils/ai-chat-context';
import { ChatContextSelection } from './types';

export const getPageContextId = (pathname: string): string =>
  sanitizeContextId(`page${pathname}`);

export const getPageContextLabel = (): string => {
  const title = document.title;
  const separator = ' | ';
  const separatorIndex = title.lastIndexOf(separator);
  if (separatorIndex > 0) {
    return title.slice(0, separatorIndex);
  }
  return title || 'Current page';
};

export const buildPageContextSelection = (pathname: string): ChatContextSelection => ({
  id: getPageContextId(pathname),
  label: getPageContextLabel(),
  description: 'Entire current page',
  route: pathname,
});

export const findPageContextElement = (pathname: string): HTMLElement | null => {
  const id = getPageContextId(pathname);
  return document.querySelector<HTMLElement>(`[${CONTEXT_ID_ATTR}="${id}"]`);
};
