import * as React from 'react';
import { IfFeature } from '~/feature-flags/hooks';
import { LightspeedStateProvider } from '~/lightspeed/LightspeedStateProvider';
import { lazyLoad, LazyLoadArguments } from '~/shared/components/lazy-load/lazy';

const AIChatDock = lazyLoad<LazyLoadArguments>(() =>
  import(
    '~/components/AIChat/AIChatDock' /* webpackChunkName: "ai-chat-dock" */
  ).then((module) => ({ default: module.AIChatDock })),
);

/**
 * Lazy-loads the PatternFly chatbot UI only when the experimental `ai-chat` flag is on.
 * Guarded by `isStagingCluster` and `isLightspeedAvailable` (see flags.ts).
 */
export const AIChatGate: React.FC = () => (
  <IfFeature flag="ai-chat">
    <LightspeedStateProvider>
      <AIChatDock />
    </LightspeedStateProvider>
  </IfFeature>
);
