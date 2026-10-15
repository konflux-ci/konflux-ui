import * as React from 'react';
import { IfFeature } from '~/feature-flags/hooks';
import { useIsLightspeedAvailable } from '~/lightspeed/useIsLightspeedAvailable';
import { lazyLoad, LazyLoadArguments } from '~/shared/components/lazy-load/lazy';

const LazyAIChatDock = lazyLoad<LazyLoadArguments>(() =>
  import('~/components/AIChat/AIChatDock' /* webpackChunkName: "ai-chat-dock" */),
);

const AIChatAvailabilityGate: React.FC = () => {
  const { isLightspeedAvailable } = useIsLightspeedAvailable();

  if (!isLightspeedAvailable) {
    return null;
  }

  return <LazyAIChatDock />;
};

/**
 * Lazy-loads the PatternFly chatbot UI only when the experimental `ai-chat` flag is on
 * and Lightspeed is available (`useIsLightspeedAvailable`).
 */
export const AIChatGate: React.FC = () => (
  <IfFeature flag="ai-chat">
    <AIChatAvailabilityGate />
  </IfFeature>
);
