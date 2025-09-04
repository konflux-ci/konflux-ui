/**
 * Tests for kubearchive conditional checks.
 *
 * Framework: Jest (ts-jest).
 * If this project uses Vitest, replace jest with vi and update mock/imports accordingly.
 */
import type { MockedFunction } from 'jest-mock';
// We need to mock the modules used by the SUT before importing it.
const mockedCreateConditionsHook = jest.fn(() => {
  // return a sentinel hook function
  return function useIsKubeArchiveEnabledMock() {
    return { loading: false, enabled: true };
  };
});
const mockedEnsureConditionIsOn = jest.fn(() => {
  // return a sentinel predicate/function
  return function isKubeArchiveEnabledMock() {
    return true;
  };
});
const mockedCommonFetch: MockedFunction<(...args: unknown[]) => unknown> = jest.fn();

jest.mock('~/feature-flags/hooks', () => ({
  // ensure type-friendly default export shape if any
  createConditionsHook: (...args: unknown[]) => mockedCreateConditionsHook(...(args as [unknown])),
}));
jest.mock('~/feature-flags/utils', () => ({
  ensureConditionIsOn: (...args: unknown[]) => mockedEnsureConditionIsOn(...(args as [unknown])),
}));
jest.mock('~/k8s', () => ({
  commonFetch: (...args: unknown[]) => mockedCommonFetch(...(args as [unknown])),
}));

// For KUBEARCHIVE_PATH_PREFIX we don't need to mock, but we verify the value passed down.
// However, importing actual constant ensures integration with real value.
jest.mock('../const', () => ({
  KUBEARCHIVE_PATH_PREFIX: '/kubearchive',
}), { virtual: true });

// Import after mocks to capture module initialization-time calls

import { checkIfKubeArchiveIsEnabled, useIsKubeArchiveEnabled, isKubeArchiveEnabled } from '../conditional-checks';
import { KUBEARCHIVE_PATH_PREFIX } from '../const';

describe('kubearchive conditional checks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkIfKubeArchiveIsEnabled', () => {
    it('returns true when /livez fetch succeeds and calls commonFetch with correct args', async () => {
      mockedCommonFetch.mockResolvedValueOnce({ status: 200 });

      const result = await checkIfKubeArchiveIsEnabled();

      expect(result).toBe(true);
      expect(mockedCommonFetch).toHaveBeenCalledTimes(1);
      // Validate parameters: path and options with pathPrefix
      const [path, options] = mockedCommonFetch.mock.calls[0];
      expect(path).toBe('/livez');
      expect(options).toEqual({ pathPrefix: KUBEARCHIVE_PATH_PREFIX });
    });

    it('returns false when /livez fetch rejects (network or 5xx error)', async () => {
      mockedCommonFetch.mockRejectedValueOnce(new Error('network down'));

      const result = await checkIfKubeArchiveIsEnabled();

      expect(result).toBe(false);
      expect(mockedCommonFetch).toHaveBeenCalledTimes(1);
    });

    it('returns true even if successful response body is unexpected (defensive)', async () => {
      mockedCommonFetch.mockResolvedValueOnce(undefined as unknown);
      await expect(checkIfKubeArchiveIsEnabled()).resolves.toBe(true);
    });

    it('returns false when commonFetch throws non-Error values', async () => {
      mockedCommonFetch.mockImplementationOnce(() => { throw 'boom'; });
      await expect(checkIfKubeArchiveIsEnabled()).resolves.toBe(false);
    });
  });

  describe('useIsKubeArchiveEnabled hook factory', () => {
    it('is the hook returned by createConditionsHook called with ["isKubearchiveEnabled"]', () => {
      // Module import already invoked createConditionsHook at eval time.
      expect(mockedCreateConditionsHook).toHaveBeenCalledTimes(1);
      expect(mockedCreateConditionsHook).toHaveBeenCalledWith(['isKubearchiveEnabled']);

      // The exported symbol should be exactly the function returned by the factory
      const returned = (mockedCreateConditionsHook.mock.results[0] as unknown)?.value;
      expect(typeof returned).toBe('function');
      expect(useIsKubeArchiveEnabled).toBe(returned);
    });

    it('returned hook provides a stable shape', () => {
      const hook = useIsKubeArchiveEnabled as unknown as () => { loading: boolean; enabled: boolean };
      const value = hook();
      expect(value).toHaveProperty('loading', expect.any(Boolean));
      expect(value).toHaveProperty('enabled', expect.any(Boolean));
    });
  });

  describe('isKubeArchiveEnabled predicate', () => {
    it('is the predicate returned by ensureConditionIsOn called with ["isKubearchiveEnabled"]', () => {
      expect(mockedEnsureConditionIsOn).toHaveBeenCalledTimes(1);
      expect(mockedEnsureConditionIsOn).toHaveBeenCalledWith(['isKubearchiveEnabled']);

      const returned = (mockedEnsureConditionIsOn.mock.results[0] as unknown)?.value;
      expect(typeof returned).toBe('function');
      expect(isKubeArchiveEnabled).toBe(returned);
    });

    it('predicate behaves as provided by factory (smoke test)', () => {
      const predicate = isKubeArchiveEnabled as unknown as () => boolean;
      expect(predicate()).toBe(true);
    });
  });
});