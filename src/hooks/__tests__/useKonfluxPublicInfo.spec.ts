import { renderHook } from '@testing-library/react-hooks';
import { MockInfo, invalidMockConfigMap, mockConfigMap } from '../../__data__/role-data';
import { createK8sUtilMock } from '../../utils/test-utils';
import { useKonfluxPublicInfo } from '../useKonfluxPublicInfo';

const k8sWatchMock = createK8sUtilMock('useK8sWatchResource');

describe('useKonfluxPublicInfo', () => {
  it('should return loading state initially', () => {
    k8sWatchMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useKonfluxPublicInfo());

    expect(result.current[0]).toEqual({});
    expect(result.current[1]).toBe(false);
    expect(result.current[2]).toBeNull();
  });

  it('should handle error state correctly', () => {
    k8sWatchMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: 'Error occurred',
    });

    const { result } = renderHook(() => useKonfluxPublicInfo());

    expect(result.current[0]).toEqual({});
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBe('Error occurred');
  });

  it('should get info.json correctly when data is available', () => {
    k8sWatchMock.mockReturnValue({
      data: mockConfigMap,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useKonfluxPublicInfo());

    expect(result.current[0]).toEqual(expect.objectContaining(MockInfo));
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeNull();
  });

  it('should handle malformed JSON gracefully', () => {
    k8sWatchMock.mockReturnValue({
      data: invalidMockConfigMap,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useKonfluxPublicInfo());

    // Ensure that even with malformed JSON, the role map is still empty
    expect(result.current[0]).toEqual({});
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeNull();
  });

  it('should memoize the infoJson', () => {
    k8sWatchMock.mockReturnValue({
      data: mockConfigMap,
      isLoading: false,
      error: null,
    });

    const { result, rerender } = renderHook(() => useKonfluxPublicInfo());

    const initiaInfoJson = result.current[0];

    // Rerender with the same props and check if memoization works (no change)
    rerender();
    expect(result.current[0]).toBe(initiaInfoJson); // Role map should not change

    // Mock the hook again with the updated configMap
    k8sWatchMock.mockReturnValue({
      data: invalidMockConfigMap,
      isLoading: false,
      error: null,
    });

    rerender();
    // infoJson should have changed
    expect(result.current[0]).not.toBe(initiaInfoJson);
  });
});

/**
 * Additional tests for getKonfluxPublicInfo (imperative util added in diff).
 * Testing stack: Jest (project-wide) + @testing-library/react-hooks for hooks.
 * These tests use Jest module isolation to avoid interfering with existing mocks in this file.
 */

describe('getKonfluxPublicInfo (imperative util)', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('fetches and parses info.json (happy path)', async () => {
    const payload = { environment: 'production', version: '1.2.3' };

    let getKonfluxPublicInfo: (options?: unknown) => Promise<unknown>;
    let k8sModule: { useK8sWatchResource: jest.Mock; k8sQueryGetResource: jest.Mock };

    jest.isolateModules(() => {
      jest.doMock('../k8s', () => ({
        useK8sWatchResource: jest.fn(),
        k8sQueryGetResource: jest.fn().mockResolvedValue({
          data: { 'info.json': JSON.stringify(payload) },
        }),
      }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      getKonfluxPublicInfo = require('../useKonfluxPublicInfo').getKonfluxPublicInfo;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      k8sModule = require('../k8s');
    });

    await expect(getKonfluxPublicInfo()).resolves.toEqual(payload);
    expect(k8sModule.k8sQueryGetResource).toHaveBeenCalledTimes(1);
    const [reqArg] = k8sModule.k8sQueryGetResource.mock.calls[0];
    expect(reqArg).toMatchObject({
      model: expect.anything(),
      queryOptions: { name: 'konflux-public-info', ns: 'konflux-info' },
    });
  });

  it('forwards provided options to k8sQueryGetResource', async () => {
    const options = { staleTime: 60000 };

    let getKonfluxPublicInfo: (options?: unknown) => Promise<unknown>;
    let k8sModule: { useK8sWatchResource: jest.Mock; k8sQueryGetResource: jest.Mock };

    jest.isolateModules(() => {
      jest.doMock('../k8s', () => ({
        useK8sWatchResource: jest.fn(),
        k8sQueryGetResource: jest.fn().mockResolvedValue({
          data: { 'info.json': '{}' },
        }),
      }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      getKonfluxPublicInfo = require('../useKonfluxPublicInfo').getKonfluxPublicInfo;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      k8sModule = require('../k8s');
    });

    await getKonfluxPublicInfo(options);
    const [, passedOptions] = k8sModule.k8sQueryGetResource.mock.calls[0];
    expect(passedOptions).toBe(options);
  });

  it('throws if info.json is missing', async () => {
    let getKonfluxPublicInfo: (options?: unknown) => Promise<unknown>;

    jest.isolateModules(() => {
      jest.doMock('../k8s', () => ({
        useK8sWatchResource: jest.fn(),
        k8sQueryGetResource: jest.fn().mockResolvedValue({
          data: {},
        }),
      }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      getKonfluxPublicInfo = require('../useKonfluxPublicInfo').getKonfluxPublicInfo;
    });

    await expect(getKonfluxPublicInfo()).rejects.toThrow(
      'info.json not found in konflux-public-info ConfigMap',
    );
  });

  it('throws with informative message on invalid JSON', async () => {
    let getKonfluxPublicInfo: (options?: unknown) => Promise<unknown>;

    jest.isolateModules(() => {
      jest.doMock('../k8s', () => ({
        useK8sWatchResource: jest.fn(),
        k8sQueryGetResource: jest.fn().mockResolvedValue({
          data: { 'info.json': '{invalid json' },
        }),
      }));
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      getKonfluxPublicInfo = require('../useKonfluxPublicInfo').getKonfluxPublicInfo;
    });

    await expect(getKonfluxPublicInfo()).rejects.toThrow(/Failed to parse info\.json:/);
  });
});