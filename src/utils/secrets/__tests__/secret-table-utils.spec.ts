import { K8S_ACCEPT_TABLE } from '~/k8s/consts/k8s-accept';
import { commonFetchJSON } from '~/k8s/fetch';
import { SecretModel } from '~/models';
import {
  fetchK8sSecretTableList,
  parseSecretTableToSecretKinds,
  SECRET_TABLE_FETCH_OPTIONS,
  SECRET_TABLE_K8S_FETCH_OPTIONS,
  selectSecretList,
  selectSecretMetadata,
} from '~/utils/secrets/secret-table-utils';

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

describe('SECRET_TABLE_K8S_FETCH_OPTIONS', () => {
  it('wraps the Table Accept header for K8s fetchOptions', () => {
    expect(SECRET_TABLE_K8S_FETCH_OPTIONS.requestInit.headers.Accept).toBe(K8S_ACCEPT_TABLE);
    expect(SECRET_TABLE_FETCH_OPTIONS.headers.Accept).toBe(K8S_ACCEPT_TABLE);
  });
});

describe('fetchK8sSecretTableList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requests table format with Accept header from fetchOptions', async () => {
    commonFetchJSONMock.mockResolvedValue(sampleTable);

    const table = await fetchK8sSecretTableList({
      model: SecretModel,
      queryOptions: { ns: 'test-ns' },
      fetchOptions: SECRET_TABLE_K8S_FETCH_OPTIONS,
    });

    expect(commonFetchJSONMock).toHaveBeenCalledWith(
      expect.stringContaining('/namespaces/test-ns/secrets'),
      { headers: { Accept: K8S_ACCEPT_TABLE } },
      expect.any(Number),
      true,
    );
    expect(table).toEqual(sampleTable);
  });
});

describe('selectSecretMetadata', () => {
  it('returns the matching secret from a table response', () => {
    expect(selectSecretMetadata('test-ns', 'regcred')(sampleTable)?.metadata?.name).toBe('regcred');
    expect(selectSecretMetadata('test-ns', 'missing')(sampleTable)).toBeUndefined();
  });
});

describe('selectSecretList', () => {
  it('returns all secrets from a table response', () => {
    expect(selectSecretList('test-ns')(sampleTable)).toHaveLength(1);
    expect(
      selectSecretList('test-ns')({ kind: 'Table', apiVersion: 'meta.k8s.io/v1', rows: [] }),
    ).toEqual([]);
  });
});
