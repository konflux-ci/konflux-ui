import * as React from 'react';
import type { MessageProps } from '@patternfly/chatbot/dist/dynamic/Message';
import { useInProgress, useMessages } from '@redhat-cloud-services/ai-react-state';
import { stateMessagesToMessageProps } from '~/lightspeed/utils';

type UseLightspeedMessagesResult = {
  messages: MessageProps[];
  isInProgress: boolean;
};

/**
 * Maps Lightspeed client-state messages into PatternFly Chatbot message props.
 */
export const useLightspeedMessages = (): UseLightspeedMessagesResult => {
  const stateMessages = useMessages();
  const isInProgress = useInProgress();

  const messages = React.useMemo(
    () => stateMessagesToMessageProps(stateMessages, isInProgress),
    [isInProgress, stateMessages],
  );

  return { messages, isInProgress };
};
