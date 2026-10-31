import { act, renderHook, waitFor } from '@testing-library/react';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import { LightspeedClientError } from '@redhat-cloud-services/lightspeed-client';
import {
  KONFLUX_AI_ERROR_MESSAGE_TOO_LONG,
  KONFLUX_AI_ERROR_PERMISSION,
  KONFLUX_AI_ERROR_QUOTA,
  KONFLUX_AI_ERROR_UNAVAILABLE,
} from '~/components/AIChat/const';
import { useAIChatSend } from '~/components/AIChat/hooks/useAIChatSend';

const mockUseSendStreamMessage = jest.fn();
const mockUseInProgress = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  useSendStreamMessage: () => mockUseSendStreamMessage(),
  useInProgress: () => mockUseInProgress(),
}));

jest.mock('~/monitoring/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

describe('useAIChatSend', () => {
  const sendStreamMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    sendStreamMessage.mockResolvedValue(undefined);
    mockUseSendStreamMessage.mockReturnValue(sendStreamMessage);
    mockUseInProgress.mockReturnValue(false);
  });

  it('sends a trimmed message', async () => {
    const { result } = renderHook(() => useAIChatSend());

    await act(async () => {
      await result.current.sendMessage('  hello world  ');
    });

    expect(sendStreamMessage).toHaveBeenCalledWith('hello world');
    expect(result.current.sendError).toBeUndefined();
  });

  it('does not send blank messages', async () => {
    const { result } = renderHook(() => useAIChatSend());

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(sendStreamMessage).not.toHaveBeenCalled();
  });

  it('does not send while a response is already in progress', async () => {
    mockUseInProgress.mockReturnValue(true);
    const { result } = renderHook(() => useAIChatSend());

    await act(async () => {
      await result.current.sendMessage('hello');
    });

    expect(sendStreamMessage).not.toHaveBeenCalled();
  });

  it.each<[number, string]>([
    [403, KONFLUX_AI_ERROR_PERMISSION],
    [413, KONFLUX_AI_ERROR_MESSAGE_TOO_LONG],
    [429, KONFLUX_AI_ERROR_QUOTA],
  ])('maps Lightspeed HTTP %s to the appropriate send error', async (status, expectedMessage) => {
    sendStreamMessage.mockRejectedValue(new LightspeedClientError(status, 'Error', 'request failed'));
    const { result } = renderHook(() => useAIChatSend());

    await act(async () => {
      await result.current.sendMessage('hello');
    });

    await waitFor(() => {
      expect(result.current.sendError).toBe(expectedMessage);
    });
    expect(mockLoggerError).toHaveBeenCalled();
  });

  it('maps unexpected errors to the unavailable message without exposing raw details', async () => {
    sendStreamMessage.mockRejectedValue(new Error('fetch failed https://internal.example'));
    const { result } = renderHook(() => useAIChatSend());

    await act(async () => {
      await result.current.sendMessage('hello');
    });

    await waitFor(() => {
      expect(result.current.sendError).toBe(KONFLUX_AI_ERROR_UNAVAILABLE);
    });
    expect(result.current.sendError).not.toContain('internal.example');
  });

  it('clears send errors', async () => {
    sendStreamMessage.mockRejectedValue(new AIClientError(503, 'Unavailable', 'down'));
    const { result } = renderHook(() => useAIChatSend());

    await act(async () => {
      await result.current.sendMessage('hello');
    });

    await waitFor(() => {
      expect(result.current.sendError).toBe(KONFLUX_AI_ERROR_UNAVAILABLE);
    });

    act(() => {
      result.current.clearSendError();
    });

    expect(result.current.sendError).toBeUndefined();
  });
});
