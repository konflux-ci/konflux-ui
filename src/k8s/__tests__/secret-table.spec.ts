import { K8S_ACCEPT_TABLE, K8S_QUERY_KEY_SECRET_TABLE } from '~/k8s/consts/k8s-accept';
import { commonFetchJSON } from '~/k8s/fetch';
import { queryClient } from '~/k8s/query/core';
import {
  createSecretListTableQueryKey,
  createSecretListTableQueryOptions,
  fetchSecretGetTable,
  fetchSecretListTable,
  K8sQuerySecretListTableItems,
  parseSecretTableToSecretKinds,
} from '~/k8s/secret-table';
import { SecretModel } from '~/models';

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
};

describe('parseSecretTableToSecretKinds', () => {
  it('maps table rows from columnDefinitions + cells (type from Type column)', () => {
    const table = {
      kind: 'Table',
      apiVersion: 'meta.k8s.io/v1',
      columnDefinitions: [
        { name: 'Name', type: 'string' },
        { name: 'Type', type: 'string' },
        { name: 'Data', type: 'string' },
        { name: 'Age', type: 'string' },
      ],
      rows: [
        {
          cells: ['regcred', 'kubernetes.io/dockerconfigjson', '1', '1d'],
          object: {
            kind: 'PartialObjectMetadata',
            apiVersion: 'meta.k8s.io/v1',
            metadata: { name: 'regcred', namespace: 'ns-a', uid: '1' },
          },
        },
      ],
    };

    const secrets = parseSecretTableToSecretKinds(table, 'ns-a');

    expect(secrets).toHaveLength(1);
    expect(secrets[0].metadata?.name).toBe('regcred');
    expect(secrets[0].metadata?.namespace).toBe('ns-a');
    expect(secrets[0].type).toBe('kubernetes.io/dockerconfigjson');
    expect(secrets[0].data).toBeUndefined();
  });

  it('uses embedded Secret.type when Type column is empty', () => {
    const table = {
      kind: 'Table',
      apiVersion: 'meta.k8s.io/v1',
      columnDefinitions: [{ name: 'Name' }, { name: 'Type' }],
      rows: [
        {
          cells: ['my-tls', ''],
          object: {
            apiVersion: 'v1',
            kind: 'Secret',
            metadata: { name: 'my-tls', namespace: 'ns-b' },
            type: 'Opaque',
          },
        },
      ],
    };

    const secrets = parseSecretTableToSecretKinds(table, 'ns-b');
    expect(secrets[0].type).toBe('Opaque');
  });

  it('returns [] when response is not a Table', () => {
    expect(parseSecretTableToSecretKinds({ kind: 'SecretList', rows: [] } as never, 'ns')).toEqual(
      [],
    );
  });
});

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
  it('builds query options with table query key and fetch fn', () => {
    const options = createSecretListTableQueryOptions('test-ns');

    expect(options.queryKey).toEqual(createSecretListTableQueryKey('test-ns'));
    expect(typeof options.queryFn).toBe('function');
  });

  it('merges additional query options', () => {
    const options = createSecretListTableQueryOptions('test-ns', { refetchInterval: 5000 });

    expect(options.refetchInterval).toBe(5000);
    expect(options.queryKey).toEqual(createSecretListTableQueryKey('test-ns'));
  });

  it('queryFn fetches and parses the secret table', async () => {
    commonFetchJSONMock.mockResolvedValue(sampleTable);

    const { queryFn } = createSecretListTableQueryOptions('test-ns');
    if (typeof queryFn !== 'function') {
      throw new Error('Expected queryFn to be a function');
    }
    const secrets = await queryFn({
      queryKey: createSecretListTableQueryKey('test-ns'),
      signal: new AbortController().signal,
      meta: undefined,
    });

    expect(secrets).toHaveLength(1);
    expect(secrets[0].metadata?.name).toBe('regcred');
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
});

describe('fetchSecretListTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests table format with Accept header and parses rows', async () => {
    commonFetchJSONMock.mockResolvedValue(sampleTable);

    const secrets = await fetchSecretListTable('test-ns');

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

describe('fetchSecretGetTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests table format for a single secret and returns the matching item', async () => {
    commonFetchJSONMock.mockResolvedValue(sampleTable);

    const secret = await fetchSecretGetTable('test-ns', 'regcred');

    expect(commonFetchJSONMock).toHaveBeenCalledWith(
      expect.stringContaining('/namespaces/test-ns/secrets/regcred'),
      { headers: { Accept: K8S_ACCEPT_TABLE } },
      expect.any(Number),
      true,
    );
    expect(secret?.metadata?.name).toBe('regcred');
    expect(secret?.type).toBe('kubernetes.io/dockerconfigjson');
  });

  it('returns undefined when the secret is not in the table response', async () => {
    commonFetchJSONMock.mockResolvedValue(sampleTable);

    const secret = await fetchSecretGetTable('test-ns', 'missing-secret');

    expect(secret).toBeUndefined();
  });
});
