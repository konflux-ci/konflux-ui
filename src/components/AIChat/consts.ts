export const LIGHTSPEED_API_BASE = '/api/lightspeed';

/** Lightspeed REST API version prefix for application endpoints (not liveness/readiness). */
export const LIGHTSPEED_API_VERSION = 'v1';

export const lightspeedVersionedPath = (path: string): string => {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `/${LIGHTSPEED_API_VERSION}${suffix}`;
};

export const KONFLUX_ASSISTANT_NAME = 'Konflux Assistant';

export const KONFLUX_AI_FOOTNOTE =
  'Konflux AI is experimental. Always review AI-generated content before use.';

export const KONFLUX_AI_WELCOME_TITLE = 'Hello';

export const KONFLUX_AI_WELCOME_DESCRIPTION =
  'How can I help you with your Konflux workspace today?';

export const KONFLUX_AI_MESSAGE_PLACEHOLDER = 'Ask about your Konflux resources...';

export const KONFLUX_AI_TOGGLE_TOOLTIP = 'Konflux AI assistant';

export const KONFLUX_AI_TOGGLE_BUTTON_LABEL = 'Open Konflux AI assistant';

export const NO_RESULTS_CONVERSATION_ID = 'no-results';
