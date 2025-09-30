import * as React from 'react';
import { useK8sAndKarchResources } from '~/hooks/useK8sAndKarchResources';
import { ReleaseGroupVersionKind, ReleaseModel } from '~/models';
import { MonitoredReleaseKind } from '~/types';

type ReleasesInNamespaceProps = {
  namespace: string;
  onReleasesLoaded: (releases: MonitoredReleaseKind[]) => void;
  onError: (error: unknown) => void;
};

const ReleasesInNamespace: React.FC<ReleasesInNamespaceProps> = ({
  namespace,
  onReleasesLoaded,
  onError,
}) => {
  const { data, isLoading, clusterError, archiveError } =
    useK8sAndKarchResources<MonitoredReleaseKind>(
      {
        groupVersionKind: ReleaseGroupVersionKind,
        namespace,
        isList: true,
      },
      ReleaseModel,
    );

  React.useEffect(() => {
    if (!isLoading) {
      const error = clusterError && archiveError;
      if (error) {
        onError(error);
      } else if (data) {
        onReleasesLoaded(data);
      }
    }
  }, [data, isLoading, clusterError, archiveError, onReleasesLoaded, onError]);

  return null;
};

export default ReleasesInNamespace;
