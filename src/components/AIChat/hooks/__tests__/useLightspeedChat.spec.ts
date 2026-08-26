import { renderHook, act } from '@testing-library/react';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import {
  useInProgress,
  useIsInitializing,
  useMessages,
  useSendStreamMessage,
} from '@redhat-cloud-services/ai-react-state';
import { useLightspeedChat } from '~/components/AIChat/hooks/useLightspeedChat';
import {
  clearPendingLightspeedAttachments,
  getPendingLightspeedAttachments,
} from '~/components/AIChat/lightspeed-attachments';
import { logger } from '~/monitoring/logger';

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  useInProgress: jest.fn(),
  useIsInitializing: jest.fn(),
  useMessages: jest.fn(),
  useSendStreamMessage: jest.fn(),
}));

const useInProgressMock = jest.mocked(useInProgress);
const useIsInitializingMock = jest.mocked(useIsInitializing);
const useMessagesMock = jest.mocked(useMessages);
const useSendStreamMessageMock = jest.mocked(useSendStreamMessage);

describe('useLightspeedChat', () => {
  const sendStreamMessage = jest.fn();

  beforeEach(() => {
    sendStreamMessage.mockReset();
    sendStreamMessage.mockResolvedValue({ answer: 'ok' });
    useInProgressMock.mockReturnValue(false);
    useIsInitializingMock.mockReturnValue(false);
    useMessagesMock.mockReturnValue([]);
    useSendStreamMessageMock.mockReturnValue(sendStreamMessage);
    document.body.innerHTML = `
      <main class="pf-v6-c-page__main">
        <span class="status-icon-with-text">Failed</span>
        <div class="log-content__row-content">task failed</div>
      </main>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    clearPendingLightspeedAttachments();
    jest.restoreAllMocks();
  });

  it('should not attach page context by default', async () => {
    const { result } = renderHook(() => useLightspeedChat());

    sendStreamMessage.mockImplementation(() => {
      expect(getPendingLightspeedAttachments()).toBeUndefined();
      return Promise.resolve({ answer: 'ok' });
    });

    await act(async () => {
      await result.current.sendMessage('why did this fail?');
    });

    expect(sendStreamMessage).toHaveBeenCalledWith('why did this fail?');
    expect(getPendingLightspeedAttachments()).toBeUndefined();
  });

  it('should attach extracted page context only when the caller opts in', async () => {
    const { result } = renderHook(() => useLightspeedChat());

    sendStreamMessage.mockImplementation(() => {
      const attachments = getPendingLightspeedAttachments();
      expect(attachments?.some((attachment) => attachment.content.includes('Failed'))).toBe(true);
      expect(attachments?.some((attachment) => attachment.content.includes('task failed'))).toBe(
        true,
      );
      return Promise.resolve({ answer: 'ok' });
    });

    await act(async () => {
      await result.current.sendMessage('why did this fail?', { includePageContext: true });
    });

    expect(sendStreamMessage).toHaveBeenCalledWith('why did this fail?');
    expect(getPendingLightspeedAttachments()).toBeUndefined();
  });

  it('should clear staged attachments after a failed send', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    sendStreamMessage.mockRejectedValue(new AIClientError(503, 'Service Unavailable', 'down'));
    const { result } = renderHook(() => useLightspeedChat());

    await act(async () => {
      await result.current.sendMessage('help', { includePageContext: true });
    });

    expect(result.current.backendError).toBe(
      'Konflux AI is temporarily unavailable. Please try again later.',
    );
    expect(getPendingLightspeedAttachments()).toBeUndefined();
  });

  it('should not send blank messages', async () => {
    const { result } = renderHook(() => useLightspeedChat());

    await act(async () => {
      await result.current.sendMessage('   ');
    });

    expect(sendStreamMessage).not.toHaveBeenCalled();
  });
});
