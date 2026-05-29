import { parseSecretTableToSecretKinds } from '~/k8s/secret-table';

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
