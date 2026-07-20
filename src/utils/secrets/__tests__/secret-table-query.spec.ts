import { K8S_ACCEPT_TABLE, K8S_QUERY_KEY_SECRET_TABLE } from '~/k8s/consts/k8s-accept';
import { commonFetchJSON } from '~/k8s/fetch';
import { queryClient } from '~/k8s/query/core';
import { SecretModel } from '~/models';
import {
  createSecretListTableQueryKey,
  createSecretListTableQueryOptions,
  K8sQuerySecretListTableItems,
} from '~/utils/secrets/secret-table-query';
import { selectSecretList, type K8sTable } from '~/utils/secrets/secret-table-utils';

jest.mock('~/k8s/fetch', () => ({
  commonFetchJSON: jest.fn(),
}));

const commonFetchJSONMock = commonFetchJSON as jest.MockedFunction<typeof commonFetchJSON>;

const sampleTable = {
  kind: 'Table',
  apiVersion: 'meta.k8s.io/v1',
  columnDefinitions: [
    { name: 'Name', type: 'string' },
    { name: 'Type', type: 'string' },
  ],
  rows: [
    {
      cells: ['regcred', 'kubernetes.io/dockerconfigjson'],
      object: {
        kind: 'PartialObjectMetadata',
        apiVersion: 'meta.k8s.io/v1',
        metadata: { name: 'regcred', namespace: 'test-ns', uid: '1' },
      },
    },
  ],
} as K8sTable;

describe('createSecretListTableQueryKey', () => {
  it('includes namespace, Secret model, and table format suffix', () => {
    const key = createSecretListTableQueryKey('test-ns');

    expect(key).toContain('test-ns');
    expect(key).toContain(K8S_QUERY_KEY_SECRET_TABLE);
    expect(key).toContainEqual({
      group: 'core',
      version: SecretModel.apiVersion,
      kind: SecretModel.kind,
    });
  });
});

describe('createSecretListTableQueryOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds query options with table query key, select, and queryFn', () => {
    const options = createSecretListTableQueryOptions('test-ns');

    expect(options.queryKey).toEqual(createSecretListTableQueryKey('test-ns'));
    expect(typeof options.queryFn).toBe('function');
    expect(typeof options.select).toBe('function');
  });

  it('merges additional query options', () => {
    const options = createSecretListTableQueryOptions('test-ns', { staleTime: 5000 });

    expect(options.staleTime).toBe(5000);
    expect(options.queryKey).toEqual(createSecretListTableQueryKey('test-ns'));
  });

  it('uses selectSecretList for the namespace', () => {
    const { select } = createSecretListTableQueryOptions('test-ns');
    if (typeof select !== 'function') {
      throw new Error('Expected select to be a function');
    }

    expect(
      (select as unknown as (table: K8sTable) => ReturnType<ReturnType<typeof selectSecretList>>)(
        sampleTable,
      ),
    ).toEqual(selectSecretList('test-ns')(sampleTable));
  });

  it('queryFn requests table format and select parses secrets', async () => {
    commonFetchJSONMock.mockResolvedValue(sampleTable);

    const { queryFn, select } = createSecretListTableQueryOptions('test-ns');
    if (typeof queryFn !== 'function' || typeof select !== 'function') {
      throw new Error('Expected queryFn and select to be functions');
    }

    const table = await queryFn({
      queryKey: createSecretListTableQueryKey('test-ns'),
      signal: new AbortController().signal,
      meta: undefined,
    });
    const secrets = select(table);

    expect(commonFetchJSONMock).toHaveBeenCalledWith(
      expect.stringContaining('/namespaces/test-ns/secrets'),
      { headers: { Accept: K8S_ACCEPT_TABLE } },
      expect.any(Number),
      true,
    );
    expect(secrets).toHaveLength(1);
    expect(secrets[0].metadata?.name).toBe('regcred');
    expect(secrets[0].type).toBe('kubernetes.io/dockerconfigjson');
    expect(secrets[0].data).toBeUndefined();
  });
});

describe('K8sQuerySecretListTableItems', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls ensureQueryData with secret table query options', async () => {
    const ensureQueryDataSpy = jest.spyOn(queryClient, 'ensureQueryData').mockResolvedValue([]);

    await K8sQuerySecretListTableItems('test-ns');

    expect(ensureQueryDataSpy).toHaveBeenCalledTimes(1);
    expect(ensureQueryDataSpy.mock.calls[0][0]).toMatchObject({
      queryKey: createSecretListTableQueryKey('test-ns'),
    });
    expect(typeof ensureQueryDataSpy.mock.calls[0][0].queryFn).toBe('function');
  });

  it('forwards merged query options to ensureQueryData', async () => {
    const ensureQueryDataSpy = jest.spyOn(queryClient, 'ensureQueryData').mockResolvedValue([]);

    await K8sQuerySecretListTableItems('test-ns', { staleTime: 10_000 });

    expect(ensureQueryDataSpy.mock.calls[0][0]).toMatchObject({
      staleTime: 10_000,
      queryKey: createSecretListTableQueryKey('test-ns'),
    });
  });

  it('returns prefetched secret list data', async () => {
    const prefetchedSecrets = [
      {
        apiVersion: SecretModel.apiVersion,
        kind: SecretModel.kind,
        metadata: { name: 'regcred', namespace: 'test-ns' },
        type: 'kubernetes.io/dockerconfigjson',
      },
    ];
    jest.spyOn(queryClient, 'ensureQueryData').mockResolvedValue(prefetchedSecrets);

    await expect(K8sQuerySecretListTableItems('test-ns')).resolves.toEqual(prefetchedSecrets);
  });
});
