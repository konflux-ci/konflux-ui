/**
 * Kubernetes API table conversion: tabular Secret list/get without full `data`,
 * while preserving printed columns such as Secret `type`.
 */
export const K8S_ACCEPT_TABLE = 'application/json;as=Table;v=v1beta1;g=meta.k8s.io';

/** React Query key segment so Table-negotiated Secret queries never share cache with full JSON list/get. */
export const K8S_QUERY_KEY_SECRET_TABLE = 'secret-table-format';
