import * as React from 'react';
import { IfFeature } from '~/feature-flags/hooks';
import { useIsLightspeedAvailable } from '~/lightspeed/conditional-checks';
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

  return <AIChatDock fallback={<></>} />;
};

/**
 * Lazy-loads the PatternFly chatbot UI only when the experimental `ai-chat` flag is on.
 */
export const AIChatGate: React.FC = () => (
  <IfFeature flag="ai-chat">
    <AIChatDockLoader />
  </IfFeature>
);
