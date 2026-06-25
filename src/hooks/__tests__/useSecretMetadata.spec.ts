import { renderHook } from '@testing-library/react';
import { K8S_QUERY_KEY_SECRET_TABLE } from '~/k8s/consts/k8s-accept';
import { SecretGroupVersionKind, SecretModel } from '~/models';
import { createK8sWatchResourceMock } from '~/unit-test-utils';
import {
  SECRET_TABLE_K8S_FETCH_OPTIONS,
  selectSecretMetadata,
  type K8sTable,
} from '~/utils/secrets/secret-table-utils';
import { mockedSecret } from '../__data__/mock-data';
import { useSecretMetadata } from '../useSecretMetadata';

const useK8sWatchResourceMock = createK8sWatchResourceMock();

describe('useSecretMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useK8sWatchResourceMock.mockReturnValue([undefined, false, null]);
  });

  it('returns secret metadata when loaded', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: mockedSecret,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useSecretMetadata('test-ns', 'my-secret'));

    expect(result.current[0]?.metadata.name).toBe('a036c-image-pull');
    expect(result.current[1]).toBe(true);
    expect(result.current[2]).toBeNull();
  });

  it('returns undefined while loading', () => {
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { result } = renderHook(() => useSecretMetadata('test-ns', 'my-secret'));

    expect(result.current).toEqual([undefined, false, null]);
  });

  it('returns error when fetch fails', () => {
    const mockError = new Error('An API error happened');
    useK8sWatchResourceMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: mockError,
    });

    const { result } = renderHook(() => useSecretMetadata('test-ns', 'my-secret'));

    expect(result.current).toEqual([undefined, true, mockError]);
  });

  it('calls useK8sWatchResource with watch disabled and table fetch options', () => {
    renderHook(() => useSecretMetadata('test-ns', 'my-secret'));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      {
        groupVersionKind: SecretGroupVersionKind,
        namespace: 'test-ns',
        name: 'my-secret',
        watch: false,
      },
      SecretModel,
      expect.objectContaining({
        enabled: true,
        select: expect.any(Function),
        queryKey: expect.arrayContaining([K8S_QUERY_KEY_SECRET_TABLE]),
      }),
      SECRET_TABLE_K8S_FETCH_OPTIONS,
    );
  });

  it('disables fetch when namespace is missing', () => {
    renderHook(() => useSecretMetadata('', 'my-secret'));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      expect.anything(),
      SecretModel,
      expect.objectContaining({ enabled: false }),
      SECRET_TABLE_K8S_FETCH_OPTIONS,
    );
  });

  it('disables fetch when name is missing', () => {
    renderHook(() => useSecretMetadata('test-ns', ''));

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(
      expect.anything(),
      SecretModel,
      expect.objectContaining({ enabled: false }),
      SECRET_TABLE_K8S_FETCH_OPTIONS,
    );
  });

  it('uses selectSecretMetadata for the select function', () => {
    renderHook(() => useSecretMetadata('test-ns', 'my-secret'));

    const queryOptions = useK8sWatchResourceMock.mock.calls[0][2];
    const table = {
      kind: 'Table',
      apiVersion: 'meta.k8s.io/v1',
      columnDefinitions: [{ name: 'Name' }, { name: 'Type' }],
      rows: [
        {
          cells: ['my-secret', 'kubernetes.io/dockerconfigjson'],
          object: {
            kind: 'PartialObjectMetadata',
            metadata: { name: 'my-secret', namespace: 'test-ns' },
          },
        },
      ],
    } as K8sTable;

    expect(queryOptions.select(table)).toEqual(selectSecretMetadata('test-ns', 'my-secret')(table));
  });
});
