import * as React from 'react';
import type { PluggableList } from 'unified';
import { logger } from '~/monitoring/logger';

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
 * `rehype-sanitize` is loaded in a separate chunk so it is not bundled with the
 * AI chat dock. Sanitization runs after every internal transform. The default
 * schema follows GitHub/GFM rules, but strips `target` and `rel` that
 * rehype-external-links adds in step 4 — those attributes are re-allowed here.
 */

let chatMessageRehypePluginsPromise: Promise<PluggableList> | undefined;

export const loadChatMessageRehypePlugins = (): Promise<PluggableList> => {
  if (!chatMessageRehypePluginsPromise) {
    chatMessageRehypePluginsPromise = import(
      'rehype-sanitize' /* webpackChunkName: "rehype-sanitize" */
    )
      .then(({ default: rehypeSanitize, defaultSchema }) => {
        const chatMessageSanitizeSchema = {
          ...defaultSchema,
          attributes: {
            ...defaultSchema.attributes,
            a: [...(defaultSchema.attributes?.a ?? []), 'target', 'rel'],
          },
        };

        return [[rehypeSanitize, chatMessageSanitizeSchema]] as PluggableList;
      })
      .catch((error: unknown) => {
        chatMessageRehypePluginsPromise = undefined;
        throw error;
      });
  }

  return chatMessageRehypePluginsPromise;
};

/**
 * Returns `undefined` until the chunk is ready so callers avoid unsanitized markdown.
 */
export const useChatMessageRehypePlugins = (): PluggableList | undefined => {
  const [plugins, setPlugins] = React.useState<PluggableList>();

  React.useEffect(() => {
    let cancelled = false;

    void loadChatMessageRehypePlugins()
      .then((loaded) => {
        if (!cancelled) {
          setPlugins(loaded);
        }
      })
      .catch((error: unknown) => {
        logger.error(
          'Failed to load rehype-sanitize for AI chat messages',
          error instanceof Error ? error : new Error(String(error)),
        );
        if (!cancelled) {
          setPlugins([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return plugins;
};
