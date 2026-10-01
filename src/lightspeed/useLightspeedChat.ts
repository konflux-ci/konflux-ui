import * as React from 'react';
import { useLocation, useMatches, useParams } from 'react-router-dom';
import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import {
  useInProgress,
  useIsInitializing,
  useMessages,
  useSendStreamMessage,
} from '@redhat-cloud-services/ai-react-state';
import { useAIChatPageContext } from '~/components/AIChat/pageContext/AIChatPageContext';
import {
  AIChatRoutePageContext,
  buildPageContextPayload,
} from '~/components/AIChat/pageContext/types';
import { buildPageContextAttachment } from '~/lightspeed/buildPageContextAttachment';
import { LIGHTSPEED_ASSISTANT_NAME } from '~/lightspeed/const';
import { setPendingQueryRequestFields } from '~/lightspeed/lightspeedQueryRequestBridge';
import {
  useLightspeedInitError,
  useRetryLightspeedInit,
} from '~/lightspeed/LightspeedStateProvider';
import { getUserFacingErrorMessage, stateMessagesToMessageProps } from '~/lightspeed/utils';
import { logger } from '~/monitoring/logger';
import { getRoutePatternFromMatches } from '~/routes/with-route-patterns';

export type SendLightspeedMessageOptions = {
  includePageContext?: boolean;
};

type UseLightspeedChatResult = {
  messages: MessageProps[];
  announcement?: string;
  isSendButtonDisabled: boolean;
  isInitializing: boolean;
  chatError?: string;
  clearChatError: () => void;
  sendMessage: (message: string, options?: SendLightspeedMessageOptions) => Promise<void>;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AIClientError) {
    return getUserFacingErrorMessage(error.status);
  }
  // Never expose raw Error.message — network/fetch details may include internal URLs.
  return getUserFacingErrorMessage(0);
};

/**
 * Send messages via Lightspeed SSE (`useSendStreamMessage` → `/v1/streaming_query`)
 * and map client-state messages into PatternFly Chatbot message props.
 */
export const useLightspeedChat = (): UseLightspeedChatResult => {
  const [sendError, setSendError] = React.useState<string>();
  const [announcement, setAnnouncement] = React.useState<string>();

  const stateMessages = useMessages();
  const sendStreamMessage = useSendStreamMessage();
  const isInProgress = useInProgress();
  const isInitializing = useIsInitializing();
  const initError = useLightspeedInitError();
  const retryInit = useRetryLightspeedInit();
  const hasInitFailed = initError !== undefined;
  const isSendingRef = React.useRef(false);
  const location = useLocation();
  const matches = useMatches();
  const params = useParams();
  const pageContext = useAIChatPageContext();
  const route = React.useMemo<AIChatRoutePageContext>(
    () => ({
      pathname: location.pathname,
      routePattern: getRoutePatternFromMatches(matches),
      params,
    }),
    [location.pathname, matches, params],
  );

  const messages = React.useMemo(
    () => stateMessagesToMessageProps(stateMessages, isInProgress),
    [isInProgress, stateMessages],
  );

  const clearChatError = React.useCallback(() => {
    setSendError(undefined);
    retryInit();
  }, [retryInit]);

  const sendMessage = React.useCallback(
    async (message: string, options?: SendLightspeedMessageOptions) => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage || isInProgress || isSendingRef.current) {
        return;
      }

      isSendingRef.current = true;
      setSendError(undefined);
      setAnnouncement(
        `Message from you: ${trimmedMessage}. ${LIGHTSPEED_ASSISTANT_NAME} is responding.`,
      );

      if (options?.includePageContext) {
        setPendingQueryRequestFields({
          attachments: [buildPageContextAttachment(buildPageContextPayload(route, pageContext))],
        });
      }

      try {
        const response = await sendStreamMessage(trimmedMessage);
        if (response?.answer) {
          setAnnouncement(`Message from ${LIGHTSPEED_ASSISTANT_NAME}: ${response.answer}`);
        }
      } catch (error) {
        logger.error(
          'Konflux AI streaming query failed',
          error instanceof Error ? error : new Error(String(error)),
        );

        const messageText = getErrorMessage(error);
        setSendError(messageText);
        setAnnouncement(`Message from ${LIGHTSPEED_ASSISTANT_NAME}: ${messageText}`);
      } finally {
        setPendingQueryRequestFields(undefined);
        isSendingRef.current = false;
      }
    },
    [isInProgress, pageContext, route, sendStreamMessage],
  );

  return {
    messages,
    announcement,
    isSendButtonDisabled: isInProgress || hasInitFailed || isInitializing,
    isInitializing: !hasInitFailed && isInitializing,
    chatError: sendError ?? initError,
    clearChatError,
    sendMessage,
  };
};
