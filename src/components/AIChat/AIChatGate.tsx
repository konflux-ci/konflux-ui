import * as React from 'react';
import { IfFeature } from '~/feature-flags/hooks';
import { LightspeedStateProvider } from '~/lightspeed/LightspeedStateProvider';

const AIChatDock = React.lazy(() =>
  import(
    '~/components/AIChat/AIChatDock' /* webpackChunkName: "ai-chat-dock" */
  ).then((module) => ({ default: module.AIChatDock })),
);

/**
 * Renders the PatternFly chatbot dock when the experimental `ai-chat` flag is on.
 * Guarded by `isStagingCluster` and `isLightspeedAvailable` (see flags.ts).
 */
export const AIChatGate: React.FC = () => (
  <IfFeature flag="ai-chat">
    <LightspeedStateProvider>
      <React.Suspense fallback={null}>
        <AIChatDock />
      </React.Suspense>
    </LightspeedStateProvider>
  </IfFeature>
);
