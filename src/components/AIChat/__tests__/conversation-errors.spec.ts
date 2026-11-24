import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import { LightspeedClientError } from '@redhat-cloud-services/lightspeed-client';
import { KONFLUX_AI_ERROR_NOT_FOUND, KONFLUX_AI_ERROR_UNAVAILABLE } from '~/components/AIChat/const';
import {
  getConversationErrorMessage,
  reportConversationError,
} from '~/components/AIChat/conversation-errors';

const mockLoggerError = jest.fn();

jest.mock('~/monitoring/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

describe('getConversationErrorMessage', () => {
  it('maps AI and Lightspeed client errors to user-facing status messages', () => {
    expect(getConversationErrorMessage(new AIClientError(404, 'missing', 'gone'))).toBe(
      KONFLUX_AI_ERROR_NOT_FOUND,
    );
    expect(
      getConversationErrorMessage(new LightspeedClientError(503, 'unavailable', 'down')),
    ).toBe(KONFLUX_AI_ERROR_UNAVAILABLE);
  });

  it('hides raw error messages for unknown failures', () => {
    expect(getConversationErrorMessage(new Error('https://internal.example/secret'))).toBe(
      KONFLUX_AI_ERROR_UNAVAILABLE,
    );
  });
});

describe('reportConversationError', () => {
  beforeEach(() => {
    mockLoggerError.mockClear();
  });

  it('logs Error instances with optional context', () => {
    const error = new Error('boom');

    reportConversationError('Failed to load', error, { conversationId: 'c1' });

    expect(mockLoggerError).toHaveBeenCalledWith('Failed to load', error, {
      conversationId: 'c1',
    });
  });

  it('wraps non-Error values before logging', () => {
    reportConversationError('Failed to load', 'timeout');

    expect(mockLoggerError).toHaveBeenCalledWith('Failed to load', expect.any(Error), undefined);
    expect((mockLoggerError.mock.calls[0][1] as Error).message).toBe('timeout');
  });
});
