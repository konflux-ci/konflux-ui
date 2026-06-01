import { K8S_ACCEPT_TABLE } from '~/k8s/consts/k8s-accept';
import { commonFetchJSON } from '~/k8s/fetch';
import { getK8sResourceURL } from '~/k8s/k8s-utils';
import { SecretModel } from '~/models';
import { SecretKind } from '~/types';

const defaultTimeout = 60_000;

/** `meta.k8s.io` Table (v1 or v1beta1) — only fields used for Secret list/get. */
export type K8sTable = {
  kind: string;
  apiVersion: string;
  columnDefinitions?: { name: string; type?: string; description?: string; priority?: number }[];
  rows: K8sTableRow[];
};

export type K8sTableRow = {
  cells?: unknown[];
  object?: SecretKind & Record<string, unknown>;
};

const cellString = (value: unknown): string => {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
};

/**
 * Maps a Kubernetes Table response for Secrets into `SecretKind[]` with `metadata` + `type`
 * (no `data`). Uses `columnDefinitions` when present; falls back to default column order
 * Name, Type, Data, Age.
 */
export const parseSecretTableToSecretKinds = (
  table: K8sTable,
  defaultNamespace: string,
): SecretKind[] => {
  if (!table || table.kind !== 'Table' || !Array.isArray(table.rows)) {
    return [];
  }

  const colNames = table.columnDefinitions?.map((c) => (c.name ?? '').toLowerCase()) ?? [
    'name',
    'type',
    'data',
    'age',
  ];
  const colIndex = (label: string) => colNames.indexOf(label.toLowerCase());

  const rawNameI = colIndex('name');
  const rawTypeI = colIndex('type');
  const nameI = rawNameI >= 0 ? rawNameI : 0;
  const typeI = rawTypeI >= 0 ? rawTypeI : 1;

  return table.rows.map((row): SecretKind => {
    const cells = (row.cells ?? []).map(cellString);
    const embedded = row.object;
    const nameFromCell = nameI >= 0 ? cells[nameI] : '';
    const typeFromCell = typeI >= 0 ? cells[typeI] : '';
    const meta = embedded?.metadata;
    const name = meta?.name || nameFromCell;
    const namespace = meta?.namespace ?? defaultNamespace;
    const resolvedType = typeFromCell || (embedded?.kind === 'Secret' ? embedded.type : undefined);

    if (embedded?.kind === 'Secret' && meta) {
      return {
        ...(embedded as SecretKind),
        apiVersion: (embedded as SecretKind).apiVersion ?? 'v1',
        kind: 'Secret',
        metadata: {
          ...meta,
          name,
          namespace,
        },
        type: resolvedType,
        data: undefined,
        stringData: undefined,
      };
    }

    if (meta) {
      return {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
          ...meta,
          name,
          namespace,
        },
        type: resolvedType,
      };
    }

    return {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: nameFromCell,
        namespace: defaultNamespace,
      },
      type: resolvedType,
    };
  });
};

export const fetchSecretListTable = async (namespace: string): Promise<SecretKind[]> => {
  const url = getK8sResourceURL(SecretModel, undefined, {
    ns: namespace,
    queryParams: {},
  });
  const table = await commonFetchJSON<K8sTable>(
    url,
    {
      headers: { Accept: K8S_ACCEPT_TABLE },
    },
    defaultTimeout,
    true,
  );
  return parseSecretTableToSecretKinds(table, namespace);
};

export const fetchSecretGetTable = async (
  namespace: string,
  name: string,
): Promise<SecretKind | undefined> => {
  const url = getK8sResourceURL(SecretModel, undefined, {
    ns: namespace,
    name,
  });
  const table = await commonFetchJSON<K8sTable>(
    url,
    {
      headers: { Accept: K8S_ACCEPT_TABLE },
    },
    defaultTimeout,
    true,
  );
  const items = parseSecretTableToSecretKinds(table, namespace);
  return items.find((s) => s.metadata?.name === name);
};
