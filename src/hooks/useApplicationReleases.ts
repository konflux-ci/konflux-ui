import { useNamespace } from '../shared/providers/Namespace';
import { ReleaseKind } from '../types';
import { getApplicationMatchLabels } from '../utils/release-utils';
import { useReleases } from './useReleases';

export const useApplicationReleases = (
  applicationName: string,
): [ReleaseKind[], boolean, unknown] => {
  const namespace = useNamespace();
  const { data, isLoading, archiveError, clusterError } = useReleases(
    namespace,
    getApplicationMatchLabels(applicationName),
  );
  return [data, !isLoading, archiveError ?? clusterError];
};
