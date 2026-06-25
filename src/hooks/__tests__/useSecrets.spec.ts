import { renderHook } from '@testing-library/react';
import { K8S_QUERY_KEY_SECRET_TABLE } from '~/k8s/consts/k8s-accept';
import { SecretGroupVersionKind, SecretModel } from '~/models';
import { createK8sWatchResourceMock } from '~/unit-test-utils';
import { createSecretListTableQueryOptions } from '~/utils/secrets/secret-table-query';
import {
  SECRET_TABLE_K8S_FETCH_OPTIONS,
  selectSecretList,
  type K8sTable,
} from '~/utils/secrets/secret-table-utils';
import { mockedSecret, mockedSecrets } from '../__data__/mock-data';
import { useSecret, useSecrets } from '../useSecrets';

const useK8sWatchResourceMock = createK8sWatchResourceMock();

describe('useSecrets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useK8sWatchResourceMock.mockReturnValue([mockedSecrets, true, undefined]);
  });

  describe('return value', () => {
    it('should return secrets when loaded', () => {
      const { result } = renderHook(() => useSecrets('test-ns', true));

      const [secrets, loaded, error] = result.current;

      expect(loaded).toBe(true);
      expect(error).toBeUndefined();
      expect(secrets).toHaveLength(3);
    });

    it('should filter out secrets being deleted', () => {
      const { result } = renderHook(() => useSecrets('test-ns', true));

      const [secrets] = result.current;

      expect(secrets.map((secret) => secret.metadata.name)).toEqual([
        'a342f-image-pull',
        'build-pipeline-c7814-dockercfg-bksxm',
        'build-pipeline-c7814-token-fbljb',
      ]);
    });

    it('should return empty array while loading', () => {
      useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);

      const { result } = renderHook(() => useSecrets('test-ns', true));

      expect(result.current).toEqual([[], false, undefined]);
    });

    it('should return empty array on error', () => {
      const mockError = new Error('An API error happened');
      useK8sWatchResourceMock.mockReturnValue([[], true, mockError]);

      const { result } = renderHook(() => useSecrets('test-ns', true));

      expect(result.current).toEqual([[], true, mockError]);
    });

    it('should return undefined secrets list when data is undefined', () => {
      useK8sWatchResourceMock.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: undefined,
      });

      const { result } = renderHook(() => useSecrets('test-ns', true));

      expect(result.current).toEqual([undefined, true, undefined]);
    });
  });

  describe('default mode', () => {
    it('should call useK8sWatchResource with list resource init and watch enabled', () => {
      renderHook(() => useSecrets('test-ns', true));

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
        {
          groupVersionKind: SecretGroupVersionKind,
          namespace: 'test-ns',
          isList: true,
          watch: true,
        },
        SecretModel,
        undefined,
        {},
      );
    });

    it('should respect watch: false', () => {
      renderHook(() => useSecrets('test-ns', false));

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({ watch: false }),
        SecretModel,
        undefined,
        {},
      );
    });

    it('should default metadataOnly to false', () => {
      renderHook(() => useSecrets('test-ns', true));

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({ watch: true }),
        SecretModel,
        undefined,
        {},
      );
    });
  });

  describe('metadataOnly mode', () => {
    it('should force watch off even when watch is true', () => {
      renderHook(() => useSecrets('test-ns', true, { metadataOnly: true }));

      expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({ watch: false }),
        SecretModel,
        expect.objectContaining({
          select: expect.any(Function),
          queryFn: expect.any(Function),
        }),
        SECRET_TABLE_K8S_FETCH_OPTIONS,
      );
    });

    it('should pass query key with secret table suffix', () => {
      renderHook(() => useSecrets('test-ns', true, { metadataOnly: true }));

      const queryOptions = useK8sWatchResourceMock.mock.calls[0][2];

      expect(queryOptions.queryKey).toEqual(createSecretListTableQueryOptions('test-ns').queryKey);
      expect(queryOptions.queryKey).toContain(K8S_QUERY_KEY_SECRET_TABLE);
    });

    it('should pass secret table select and queryFn', () => {
      renderHook(() => useSecrets('test-ns', true, { metadataOnly: true }));

      const queryOptions = useK8sWatchResourceMock.mock.calls[0][2];

      expect(typeof queryOptions.queryFn).toBe('function');
      expect(typeof queryOptions.select).toBe('function');
      expect(
        queryOptions.select({ kind: 'Table', apiVersion: 'meta.k8s.io/v1', rows: [] } as K8sTable),
      ).toEqual(
        selectSecretList('test-ns')({ kind: 'Table', apiVersion: 'meta.k8s.io/v1', rows: [] }),
      );
    });

    it('should still filter deleted secrets when loaded', () => {
      const { result } = renderHook(() => useSecrets('test-ns', true, { metadataOnly: true }));

      expect(result.current[0]).toHaveLength(3);
      expect(result.current[0].map((secret) => secret.metadata.name)).not.toContain(
        'a036c-image-pull',
      );
    });
  });
});

describe('useSecret', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useK8sWatchResourceMock.mockReturnValue([mockedSecret, true, undefined]);
  });

  it('should return secret when loaded', () => {
    const { result } = renderHook(() => useSecret('test-ns', 'a036c-image-pull'));

    const [secret, loaded, error] = result.current;

    expect(loaded).toBe(true);
    expect(error).toBeUndefined();
    expect(secret?.metadata.name).toBe('a036c-image-pull');
  });

  it('should return undefined while loading', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useSecret('test-ns', 'a036c-image-pull'));

    expect(result.current).toEqual([undefined, false, null]);
  });

  it('should return error when API fails', () => {
    const mockError = new Error('An API error happened');
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useSecret('test-ns', 'a036c-image-pull'));

    expect(result.current).toEqual([undefined, true, mockError]);
  });

  it('should call useK8sWatchResource with namespace and name', () => {
    renderHook(() => useSecret('test-ns', 'my-secret'));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      {
        groupVersionKind: SecretGroupVersionKind,
        namespace: 'test-ns',
        name: 'my-secret',
      },
      SecretModel,
    );
  });
});
