import * as React from 'react';
import { AIStateProvider } from '@redhat-cloud-services/ai-react-state';
import { AIChatDock } from '~/components/AIChat/AIChatDock';
import { getLightspeedClient } from '~/lightspeed/lightspeedClient';

/**
 * Mounts AI client state and the chat dock. Loaded asynchronously from
 * {@link AIChatGate} so Lightspeed / ai-react-state stay out of the main bundle.
 */
const AIChatDockLoader: React.FC = () => (
  <AIStateProvider client={getLightspeedClient()}>
    <AIChatDock />
  </AIStateProvider>
);

export default AIChatDockLoader;
