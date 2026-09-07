import * as React from 'react';
import { IfFeature } from '~/feature-flags/hooks';
import { useIsLightspeedAvailable } from '~/lightspeed/conditional-checks';
import { LightspeedStateProvider } from '~/lightspeed/LightspeedStateProvider';

const AIChatDock = React.lazy(() =>
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
    <React.Suspense fallback={null}>
      <AIChatDock />
    </React.Suspense>
  );
};

/**
 * Lazy-loads the PatternFly chatbot UI only when the experimental `ai-chat` flag is on.
 */
export const AIChatGate: React.FC = () => (
  <IfFeature flag="ai-chat">
    <LightspeedStateProvider>
      <AIChatDockLoader />
    </LightspeedStateProvider>
  </IfFeature>
);
