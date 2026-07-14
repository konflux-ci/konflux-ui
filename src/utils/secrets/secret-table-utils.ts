import { K8S_ACCEPT_TABLE } from '~/k8s/consts/k8s-accept';
import { commonFetchJSON } from '~/k8s/fetch';
import type { K8sResourceListOptions } from '~/k8s/k8s-fetch';
import { getK8sResourceURL } from '~/k8s/k8s-utils';
import { SecretModel } from '~/models';
import { SecretKind } from '~/types';

const defaultTimeout = 60_000;

export const SECRET_TABLE_FETCH_OPTIONS = {
  headers: { Accept: K8S_ACCEPT_TABLE },
} as const;

/** Shape for `useK8sWatchResource` fourth argument / `K8sResourceBaseOptions.fetchOptions`. */
export const SECRET_TABLE_K8S_FETCH_OPTIONS = {
  requestInit: SECRET_TABLE_FETCH_OPTIONS,
} as const;

/** `meta.k8s.io` Table (v1) — only fields used for Secret list/get. */
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
 * (no `data`). Uses `columnDefinitions` when present; falls back to Name then Type (cells 0 and 1).
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
    const resolvedType =
      typeFromCell || (embedded?.kind === SecretModel.kind ? embedded.type : undefined);

    const secretFields = {
      apiVersion: SecretModel.apiVersion,
      kind: SecretModel.kind,
      type: resolvedType,
    };

    if (embedded?.kind === SecretModel.kind && meta) {
      return {
        ...(embedded as SecretKind),
        ...secretFields,
        metadata: {
          ...meta,
          name,
          namespace,
        },
        data: undefined,
        stringData: undefined,
      };
    }

    if (meta) {
      return {
        ...secretFields,
        metadata: {
          ...meta,
          name,
          namespace,
        },
      };
    }

    return {
      ...secretFields,
      metadata: {
        name: nameFromCell,
        namespace,
      },
    };
  });
};

export const selectSecretMetadata =
  (namespace: string, name: string) =>
  (table: K8sTable): SecretKind | undefined =>
    parseSecretTableToSecretKinds(table, namespace).find(
      (secret) => secret.metadata?.name === name,
    );

export const selectSecretList =
  (namespace: string) =>
  (table: K8sTable): SecretKind[] =>
    parseSecretTableToSecretKinds(table, namespace);

/** @internal Exported for query-option builders that need the same list fetch as metadata-only hooks. */
export const fetchK8sSecretTableList = ({
  model,
  queryOptions = {},
  fetchOptions = {},
}: K8sResourceListOptions): Promise<K8sTable> => {
  const url = getK8sResourceURL(model, undefined, {
    ns: queryOptions.ns,
    queryParams: queryOptions.queryParams,
  });
  return commonFetchJSON<K8sTable>(
    url,
    fetchOptions.requestInit,
    fetchOptions.timeout ?? defaultTimeout,
    true,
  );
};
