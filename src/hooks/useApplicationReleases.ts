import { useNamespace } from '../shared/providers/Namespace';
import { ReleaseKind } from '../types';
import { useReleases } from './useReleases';

export const useApplicationReleases = (
  applicationName: string,
): [ReleaseKind[], boolean, unknown] => {
  const namespace = useNamespace();
  return useReleases(namespace, applicationName);
};
