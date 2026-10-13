import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import {
  KONFLUX_AI_ERROR_PERMISSION,
  KONFLUX_AI_ERROR_UNAVAILABLE,
} from '~/components/AIChat/const';
import {
  AIChatSendProvider,
  useAIChatSend,
} from '~/components/AIChat/hooks/useAIChatSend';

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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AIChatSendProvider>{children}</AIChatSendProvider>
);

describe('AIChatSendProvider / useAIChatSend', () => {
  const sendStreamMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    sendStreamMessage.mockResolvedValue(undefined);
    mockUseSendStreamMessage.mockReturnValue(sendStreamMessage);
    mockUseInProgress.mockReturnValue(false);
  });

  it('throws when used outside the provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useAIChatSend())).toThrow(
      'useAIChatSend must be used within AIChatSendProvider',
    );

    consoleError.mockRestore();
  });

  it('sends a trimmed message', async () => {
    const { result } = renderHook(() => useAIChatSend(), { wrapper });

    await act(async () => {
      await result.current.sendMessage('  hello world  ');
    });

    expect(sendStreamMessage).toHaveBeenCalledWith('hello world');
    expect(result.current.sendError).toBeUndefined();
  });

  it('does not send blank messages', async () => {
    const { result } = renderHook(() => useAIChatSend(), { wrapper });

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(sendStreamMessage).not.toHaveBeenCalled();
  });

  it('does not send while a response is already in progress', async () => {
    mockUseInProgress.mockReturnValue(true);
    const { result } = renderHook(() => useAIChatSend(), { wrapper });

    await act(async () => {
      await result.current.sendMessage('hello');
    });

    expect(sendStreamMessage).not.toHaveBeenCalled();
  });

  it('maps AIClientError status codes to user-facing send errors', async () => {
    sendStreamMessage.mockRejectedValue(new AIClientError(403, 'Forbidden', 'denied'));
    const { result } = renderHook(() => useAIChatSend(), { wrapper });

    await act(async () => {
      await result.current.sendMessage('hello');
    });

    await waitFor(() => {
      expect(result.current.sendError).toBe(KONFLUX_AI_ERROR_PERMISSION);
    });
    expect(mockLoggerError).toHaveBeenCalled();
  });

  it('maps unexpected errors to the unavailable message without exposing raw details', async () => {
    sendStreamMessage.mockRejectedValue(new Error('fetch failed https://internal.example'));
    const { result } = renderHook(() => useAIChatSend(), { wrapper });

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
    const { result } = renderHook(() => useAIChatSend(), { wrapper });

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
