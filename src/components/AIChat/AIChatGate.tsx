import * as React from 'react';
import { AIStateProvider } from '@redhat-cloud-services/ai-react-state';
import { IfFeature } from '~/feature-flags/hooks';
import { useIsLightspeedAvailable } from '~/lightspeed/conditional-checks';
import { getLightspeedClient } from '~/lightspeed/lightspeedClient';
import { lazyLoad, LazyLoadArguments } from '~/shared/components/lazy-load/lazy';

const AIChatDock = lazyLoad<LazyLoadArguments>(() =>
  import(
    '~/components/AIChat/AIChatDock' /* webpackChunkName: "ai-chat-dock" */
  ).then((module) => ({ default: module.AIChatDock })),
);

const AIChatDockLoader: React.FC = () => {
  const { isLightspeedAvailable } = useIsLightspeedAvailable();

  if (!isLightspeedAvailable) {
    return null;
  }

  return (
    <AIStateProvider client={getLightspeedClient()}>
      <AIChatDock />
    </AIStateProvider>
  );
};

/**
 * Lazy-loads the PatternFly chatbot UI only when the experimental `ai-chat` flag is on
 * and Lightspeed is available (`useIsLightspeedAvailable`).
 */
export const AIChatGate: React.FC = () => (
  <IfFeature flag="ai-chat">
    <AIChatDockLoader />
  </IfFeature>
);
