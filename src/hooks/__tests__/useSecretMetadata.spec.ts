import * as React from 'react';
import { QueryClient, QueryClientProvider, UseQueryOptions } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { K8S_QUERY_KEY_SECRET_TABLE, SECRET_POLLING_INTERVAL } from '~/k8s/consts/k8s-accept';
import { createQueryKeys } from '~/k8s/query/utils';
import { fetchSecretGetTable } from '~/k8s/secret-table';
import { SecretModel } from '~/models';
import { SecretKind } from '~/types';
import { createTestQueryClient } from '~/unit-test-utils/mock-react-query';
import { mockedSecret } from '../__data__/mock-data';
import { useSecretMetadata } from '../useSecretMetadata';

jest.mock('~/k8s/secret-table', () => ({
  ...jest.requireActual('~/k8s/secret-table'),
  fetchSecretGetTable: jest.fn(),
}));

const fetchSecretGetTableMock = fetchSecretGetTable as jest.MockedFunction<
  typeof fetchSecretGetTable
>;

const metadataOnlySecret = {
  ...mockedSecret,
  metadata: {
    ...mockedSecret.metadata,
    name: 'my-secret',
    namespace: 'test-ns',
    deletionTimestamp: undefined,
  },
  data: undefined,
  stringData: undefined,
};

describe('useSecretMetadata', () => {
  let queryClient: QueryClient;

  const renderHookWithQueryClient = <T>(hook: () => T) =>
    renderHook(hook, {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  it('returns secret metadata when loaded', async () => {
    fetchSecretGetTableMock.mockResolvedValue(metadataOnlySecret);

    const { result } = renderHookWithQueryClient(() => useSecretMetadata('test-ns', 'my-secret'));

    await waitFor(() => {
      expect(result.current[1]).toBe(true);
    });

    expect(result.current[0]?.metadata.name).toBe('my-secret');
    expect(result.current[0]?.type).toBe('kubernetes.io/dockerconfigjson');
    expect(result.current[2]).toBeNull();
  });

  it('returns undefined while loading', () => {
    fetchSecretGetTableMock.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHookWithQueryClient(() => useSecretMetadata('test-ns', 'my-secret'));

    expect(result.current).toEqual([undefined, false, null]);
  });

  it('returns error when fetch fails', async () => {
    const mockError = new Error('An API error happened');
    fetchSecretGetTableMock.mockRejectedValue(mockError);

    const { result } = renderHookWithQueryClient(() => useSecretMetadata('test-ns', 'my-secret'));

    await waitFor(() => {
      expect(result.current[1]).toBe(true);
    });

    expect(result.current).toEqual([undefined, true, mockError]);
  });

  it('does not fetch when namespace is missing', () => {
    renderHookWithQueryClient(() => useSecretMetadata('', 'my-secret'));

    expect(fetchSecretGetTableMock).not.toHaveBeenCalled();
  });

  it('does not fetch when name is missing', () => {
    renderHookWithQueryClient(() => useSecretMetadata('test-ns', ''));

    expect(fetchSecretGetTableMock).not.toHaveBeenCalled();
  });

  it('calls fetchSecretGetTable with namespace and name', async () => {
    fetchSecretGetTableMock.mockResolvedValue(metadataOnlySecret);

    renderHookWithQueryClient(() => useSecretMetadata('test-ns', 'my-secret'));

    await waitFor(() => {
      expect(fetchSecretGetTableMock).toHaveBeenCalledWith('test-ns', 'my-secret');
    });
  });

  it('uses secret table query key and polling interval', async () => {
    fetchSecretGetTableMock.mockResolvedValue(metadataOnlySecret);

    renderHookWithQueryClient(() => useSecretMetadata('test-ns', 'my-secret'));

    await waitFor(() => {
      expect(fetchSecretGetTableMock).toHaveBeenCalled();
    });

    const expectedQueryKey = [
      ...createQueryKeys({
        model: SecretModel,
        queryOptions: { ns: 'test-ns', name: 'my-secret' },
      }),
      K8S_QUERY_KEY_SECRET_TABLE,
    ];
    const query = queryClient.getQueryCache().find({ queryKey: expectedQueryKey });

    expect(query?.queryKey).toEqual(expectedQueryKey);
    expect((query?.options as UseQueryOptions<SecretKind>).refetchInterval).toBe(
      SECRET_POLLING_INTERVAL,
    );
  });
});
