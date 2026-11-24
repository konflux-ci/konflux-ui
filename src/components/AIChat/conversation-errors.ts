import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import { LightspeedClientError } from '@redhat-cloud-services/lightspeed-client';
import { getUserFacingErrorMessage } from '~/components/AIChat/message-utils';
import { logger } from '~/monitoring/logger';

export const getConversationErrorMessage = (error: unknown): string => {
  if (error instanceof AIClientError || error instanceof LightspeedClientError) {
    return getUserFacingErrorMessage(error.status);
  }
  // Never expose raw Error.message — network details may include internal URLs.
  return getUserFacingErrorMessage(0);
};

export const reportConversationError = (
  message: string,
  error: unknown,
  context?: Record<string, unknown>,
) => {
  logger.error(message, error instanceof Error ? error : new Error(String(error)), context);
};
