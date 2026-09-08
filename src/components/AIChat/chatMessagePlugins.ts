import rehypeSanitize from 'rehype-sanitize';
import type { PluggableList } from 'unified';

/**
 * Rehype plugins passed to PatternFly `<Message additionalRehypePlugins={...}>`.
 *
 * `MarkdownContent` in `@patternfly/chatbot` builds its pipeline as:
 * 1. rehype-unwrap-images
 * 2. rehypeMoveImagesOutOfParagraphs
 * 3. rehype-highlight
 * 4. rehype-external-links (when `openLinkInNewTab` is true, the default)
 * 5. `additionalRehypePlugins` (this list — always appended last)
 *
 * Registering rehype-sanitize here ensures sanitization runs after every
 * internal transform. The default schema follows GitHub/GMF rules.
 */
export const CHAT_MESSAGE_REHYPE_PLUGINS: PluggableList = [rehypeSanitize];
