import rehypeSanitize from 'rehype-sanitize';
import type { PluggableList } from 'unified';

/**
 * Sanitize HTML produced while rendering chat markdown.
 * @patternfly/chatbot ships rehype-sanitize but does not register it as its own
 * rehype plugin in MarkdownContent, so we pass it explicitly.
 */
export const CHAT_MESSAGE_REHYPE_PLUGINS: PluggableList = [rehypeSanitize];
