import * as React from 'react';
import { AIChatStateProvider } from '~/components/AIChat/AIChatStateProvider';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';

const AIChatDock = React.lazy(() =>
  import('~/components/AIChat/AIChatDock').then((module) => ({ default: module.AIChatDock })),
);

/**
 * Lazy-loads the PatternFly v6 chatbot only when the experimental `ai-chat` flag is on.
 */
export const AIChatGate: React.FC = () => {
  const isAiChatEnabled = useIsOnFeatureFlag('ai-chat');

  if (!isAiChatEnabled) {
    return null;
  }

  return (
    <AIChatStateProvider>
      <React.Suspense fallback={null}>
        <AIChatDock />
      </React.Suspense>
    </AIChatStateProvider>
  );
};
