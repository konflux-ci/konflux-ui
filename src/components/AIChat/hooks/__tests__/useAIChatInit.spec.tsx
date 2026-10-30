import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { AIClientError } from '@redhat-cloud-services/ai-client-common';
import {
  KONFLUX_AI_ERROR_PERMISSION,
  KONFLUX_AI_ERROR_UNAVAILABLE,
} from '~/components/AIChat/const';
import { useAIChatInit } from '~/components/AIChat/hooks/useAIChatInit';

const mockUseIsInitializing = jest.fn();
const mockInit = jest.fn();
const mockGetState = jest.fn(() => ({ init: mockInit }));
const mockLoggerError = jest.fn();

jest.mock('@redhat-cloud-services/ai-react-state', () => ({
  AIStateContext: React.createContext({ getState: () => ({ init: jest.fn() }) }),
  useIsInitializing: () => mockUseIsInitializing(),
}));

jest.mock('~/monitoring/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

// Re-import after mock so the hook uses our mocked AIStateContext value via a wrapper.
const { AIStateContext }: {
  AIStateContext: React.Context<{ getState: () => { init: typeof mockInit } }>;
} = jest.requireMock('@redhat-cloud-services/ai-react-state');

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AIStateContext.Provider value={{ getState: mockGetState }}>
    {children}
  </AIStateContext.Provider>
);

describe('useAIChatInit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsInitializing.mockReturnValue(false);
    mockInit.mockResolvedValue(undefined);
    mockGetState.mockReturnValue({ init: mockInit });
  });

  it('initializes the Lightspeed client on mount', async () => {
    renderHook(() => useAIChatInit(), { wrapper });

    await waitFor(() => {
      expect(mockInit).toHaveBeenCalledTimes(1);
    });
  });

  it('reports initializing while client init is in progress and there is no error', () => {
    mockUseIsInitializing.mockReturnValue(true);
    const { result } = renderHook(() => useAIChatInit(), { wrapper });

    expect(result.current.isInitializing).toBe(true);
    expect(result.current.initError).toBeUndefined();
  });

  it('maps AIClientError status codes to user-facing init errors', async () => {
    mockInit.mockRejectedValue(new AIClientError(401, 'Unauthorized', 'nope'));
    const { result } = renderHook(() => useAIChatInit(), { wrapper });

    await waitFor(() => {
      expect(result.current.initError).toBe(KONFLUX_AI_ERROR_PERMISSION);
    });
    expect(result.current.isInitializing).toBe(false);
    expect(mockLoggerError).toHaveBeenCalled();
  });

  it('maps unexpected init failures to the unavailable message', async () => {
    mockInit.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useAIChatInit(), { wrapper });

    await waitFor(() => {
      expect(result.current.initError).toBe(KONFLUX_AI_ERROR_UNAVAILABLE);
    });
  });

  it('retries init and clears the previous error', async () => {
    mockInit.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useAIChatInit(), { wrapper });

    await waitFor(() => {
      expect(result.current.initError).toBe(KONFLUX_AI_ERROR_UNAVAILABLE);
    });

    act(() => {
      result.current.retryInit();
    });

    await waitFor(() => {
      expect(result.current.initError).toBeUndefined();
    });
    expect(mockInit).toHaveBeenCalledTimes(2);
  });
});
