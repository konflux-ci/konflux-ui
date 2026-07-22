import * as React from 'react';
import { AIChatStateProvider } from '~/components/AIChat/AIChatStateProvider';
import { useIsLightspeedAvailable } from '~/components/AIChat/conditional-checks';
import { IfFeature } from '~/feature-flags/hooks';

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
    <AIChatStateProvider>
      <AIChatDockLoader />
    </AIChatStateProvider>
  </IfFeature>
);
